import * as path from 'path';
import { CfnOutput, Duration, RemovalPolicy, Size, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import {
  AllowedMethods,
  CachePolicy,
  CachedMethods,
  Distribution,
  Function as CloudFrontFunction,
  FunctionCode,
  FunctionEventType,
  FunctionRuntime,
  HttpVersion,
  OriginRequestPolicy,
  PriceClass,
  S3OriginAccessControl,
  SSLMethod,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { FunctionUrlOrigin, S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { BucketDeployment, Source, CacheControl } from 'aws-cdk-lib/aws-s3-deployment';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { FunctionUrlAuthType, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PublicHostedZone, TxtRecord } from 'aws-cdk-lib/aws-route53';
import { EmailIdentity, Identity } from 'aws-cdk-lib/aws-ses';

export interface PortfolioDeployStackProps extends StackProps {
  domainName: string;
  hostedZoneId: string;
  bucketName: string;
  distributionId: string;
  distributionDomainName: string;
  sourcePath: string;
  /** Domain SES signs contact mail for — the hosted zone above. */
  sendingDomain: string;
  /** Envelope From for contact mail; an address on `sendingDomain`. */
  fromEmail: string;
  /**
   * Contact form recipients. The SES account is in the sandbox, so each of
   * these has to be a verified identity in this region. Supplied from the
   * gitignored `config.local.ts` — personal inboxes stay out of the repo.
   */
  toEmails: readonly string[];
}

export class PortfolioDeployStack extends Stack {
  constructor(scope: Construct, id: string, props: PortfolioDeployStackProps) {
    super(scope, id, props);

    const { domainName, hostedZoneId, sendingDomain, fromEmail, toEmails } = props;

    const hostedZone = PublicHostedZone.fromPublicHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId,
      zoneName: domainName,
    });

    const siteBucket = Bucket.fromBucketName(this, 'SiteBucket', props.bucketName);

    const distribution = Distribution.fromDistributionAttributes(this, 'SiteDistributionRef', {
      distributionId: props.distributionId,
      domainName: props.distributionDomainName,
    });

    // Images and video live here rather than in the site bucket (and rather
    // than in git): they are not part of the build, and the site deployments
    // below prune anything they did not upload. Populated by
    // scripts/media-push.sh, never by a deploy.
    const mediaBucket = new Bucket(this, 'MediaBucket', {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // The live distribution, transcribed property-for-property from
    // `aws cloudfront get-distribution-config --id EEN9EO2INB4OB` so it can be
    // adopted with `cdk import`. Nothing here creates or replaces anything: the
    // import binds this logical ID to the existing distribution, and every
    // property below already holds on it.
    //
    // The gate on that is CloudFormation drift detection, not `cdk diff` — a
    // diff straight after an import compares the template to the template that
    // was just imported and is always empty. Everything under DistributionConfig
    // updates in place, so a mistranscribed property would quietly change a live
    // setting on the next deploy rather than failing loudly.
    //
    // The bucket deliberately stays `Bucket.fromBucketName` and the OAC is
    // referenced by id: on a bucket it does not own, CDK cannot attach a policy,
    // so it warns and emits no AWS::S3::BucketPolicy. That is what we want —
    // creating a policy on a bucket that already has one overwrites it, and the
    // console-created statement is the one CloudFront reads through.
    const originAccessControl = S3OriginAccessControl.fromOriginAccessControlId(
      this,
      'SiteOriginAccessControl',
      'E2PP8QRV8Q8F4C'
    );

    const siteOrigin = S3BucketOrigin.withOriginAccessControl(siteBucket, {
      originAccessControl,
      originId: 'shanehobson.me.s3.us-east-2.amazonaws.com',
      originShieldEnabled: false,
      connectionAttempts: 3,
      connectionTimeout: Duration.seconds(10),
    });

    const defaultBehavior = {
      origin: siteOrigin,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
      cachedMethods: CachedMethods.CACHE_GET_HEAD,
      compress: true,
      cachePolicy: CachePolicy.CACHING_OPTIMIZED,
    };

    // With an OAC/S3 origin, CloudFront's DefaultRootObject only resolves "/",
    // so a request for /blog/ or /blog/<slug> reaches S3 as a key that does not
    // exist. This rewrites directory-style URIs to the index.html underneath
    // them, which is what makes the pretty URLs resolve at all.
    //
    // Kept off the default behavior deliberately: the root site works as it is
    // and this only needs to cover the blog. "/blog" needs its own pattern
    // because "/blog/*" does not match the bare prefix.
    const directoryIndex = new CloudFrontFunction(this, 'BlogDirectoryIndex', {
      runtime: FunctionRuntime.JS_2_0,
      comment: 'Rewrites directory-style blog URIs to their index.html',
      code: FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var uri = request.uri;
  if (uri.charAt(uri.length - 1) === '/') {
    request.uri = uri + 'index.html';
    return request;
  }
  var lastSegment = uri.substring(uri.lastIndexOf('/') + 1);
  if (lastSegment.indexOf('.') === -1) {
    request.uri = uri + '/index.html';
  }
  return request;
}
`),
    });

    const blogBehavior = {
      ...defaultBehavior,
      functionAssociations: [
        { function: directoryIndex, eventType: FunctionEventType.VIEWER_REQUEST },
      ],
    };

    // Served from the same origin as the site, so markup keeps using plain
    // `/images/...` and `/video/...` paths — no absolute media host, no CORS.
    // The media bucket is owned by this stack, so here CDK does create the
    // OAC and the bucket policy that lets CloudFront read through it.
    // WebP and MP4 are already compressed, so CloudFront compression is off.
    const mediaBehavior = {
      origin: S3BucketOrigin.withOriginAccessControl(mediaBucket),
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
      cachedMethods: CachedMethods.CACHE_GET_HEAD,
      compress: false,
      cachePolicy: CachePolicy.CACHING_OPTIMIZED,
    };

    // ------------------------------------------------------------ contact form

    // Domain identity for the contact form's Lambda. CDK writes the DKIM
    // CNAMEs and the custom MAIL FROM MX/SPF records into the hosted zone, so
    // the mail is aligned on both SPF and DKIM.
    const emailIdentity = new EmailIdentity(this, 'SiteEmailIdentity', {
      identity: Identity.publicHostedZone(hostedZone),
      mailFromDomain: `mail.${sendingDomain}`,
    });

    // Strict alignment, and aggregate reports to the first recipient — the
    // one inbox we know is already watched.
    new TxtRecord(this, 'DmarcRecord', {
      zone: hostedZone,
      recordName: `_dmarc.${sendingDomain}`,
      values: [`v=DMARC1; p=quarantine; rua=mailto:${toEmails[0]}; adkim=s; aspf=s; pct=100`],
    });

    // Per-IP submission counter for the contact form. Items carry a TTL and
    // are worthless once expired, so the table is disposable.
    const rateLimitTable = new Table(this, 'ContactRateLimitTable', {
      partitionKey: { name: 'pk', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const contactFn = new NodejsFunction(this, 'ContactFunction', {
      entry: path.join(__dirname, '..', 'lambda', 'contact', 'handler.ts'),
      handler: 'handler',
      runtime: Runtime.NODEJS_20_X,
      timeout: Duration.seconds(10),
      memorySize: 256,
      environment: {
        TO_EMAILS: toEmails.join(','),
        FROM_EMAIL: fromEmail,
        RATE_LIMIT_TABLE: rateLimitTable.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: false,
        target: 'node20',
        // Provided by the Node 20 runtime; bundling them only inflates the
        // artefact.
        externalModules: ['@aws-sdk/client-sesv2', '@aws-sdk/client-dynamodb'],
      },
    });

    rateLimitTable.grantReadWriteData(contactFn);

    contactFn.addToRolePolicy(
      new PolicyStatement({
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: [
          emailIdentity.emailIdentityArn,
          ...toEmails.map(
            (email) => `arn:aws:ses:${this.region}:${this.account}:identity/${email}`
          ),
        ],
      })
    );

    // No CORS block: the browser only ever reaches this through the
    // CloudFront behaviour below, which makes the call same-origin. The
    // Function URL itself stays out of the repo.
    const fnUrl = contactFn.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
    });

    // The distribution has no error-page rewrites, so the Lambda's own
    // 400/405/429/502 pass through intact. ALL_VIEWER_EXCEPT_HOST_HEADER
    // forwards the body and content-type while leaving Host as the Function
    // URL's own, which its SigV4-less auth still requires.
    const contactBehavior = {
      origin: new FunctionUrlOrigin(fnUrl),
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: AllowedMethods.ALLOW_ALL,
      cachePolicy: CachePolicy.CACHING_DISABLED,
      originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
    };

    new Distribution(this, 'SiteDistribution', {
      defaultBehavior,
      additionalBehaviors: {
        '/blog': blogBehavior,
        '/blog/*': blogBehavior,
        '/images/*': mediaBehavior,
        '/video/*': mediaBehavior,
        '/api/contact': contactBehavior,
      },
      domainNames: ['shanehobson.me', 'www.shanehobson.me'],
      certificate: Certificate.fromCertificateArn(
        this,
        'SiteCertificate',
        'arn:aws:acm:us-east-1:730335671883:certificate/d2493128-1354-4f5a-90fd-0cb06773edf0'
      ),
      sslSupportMethod: SSLMethod.SNI,
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
      defaultRootObject: 'index.html',
      priceClass: PriceClass.PRICE_CLASS_100,
      httpVersion: HttpVersion.HTTP2,
      enableIpv6: true,
      enabled: true,
    }).applyRemovalPolicy(RemovalPolicy.RETAIN);

    const sitePath = path.resolve(__dirname, '..', props.sourcePath);
    const dotFiles = ['.DS_Store', '**/.DS_Store'];

    // The site is deployed as one deployment per prefix rather than one for the
    // whole bucket, because each prefix wants a different Cache-Control. Each
    // one prunes only within its own prefix.
    const shared = {
      destinationBucket: siteBucket,
      memoryLimit: 1024,
      ephemeralStorageSize: Size.mebibytes(1024),
      prune: true,
    };

    // Vite content-hashes filenames under /assets, so a changed file is a new
    // URL and the old one can be cached forever.
    const assets = new BucketDeployment(this, 'DeploySiteAssets', {
      ...shared,
      sources: [Source.asset(path.join(sitePath, 'assets'), { exclude: dotFiles })],
      destinationKeyPrefix: 'assets',
      cacheControl: [
        CacheControl.setPublic(),
        CacheControl.maxAge(Duration.days(365)),
        CacheControl.immutable(),
      ],
    });

    // dist/blog holds only HTML and feed.xml — the posts' images and CSS are
    // content-hashed into dist/assets under the immutable policy above — so the
    // same revalidate-every-time policy as index.html costs nothing here.
    // Pruning is safe because it is scoped to this deployment's own prefix.
    const blog = new BucketDeployment(this, 'DeploySiteBlog', {
      ...shared,
      sources: [Source.asset(path.join(sitePath, 'blog'), { exclude: dotFiles })],
      destinationKeyPrefix: 'blog',
      cacheControl: [
        CacheControl.setPublic(),
        CacheControl.maxAge(Duration.seconds(0)),
        CacheControl.mustRevalidate(),
      ],
    });

    // Everything left at the root — index.html above all — must be revalidated
    // every time, or a deploy never reaches anyone holding a cached copy.
    // Pruning is off here: this deployment has no prefix to scope deletion to,
    // so pruning would delete the prefixes above. For the same reason every
    // prefix that has its own deployment must be excluded, or this one would
    // also upload those files at the wrong Cache-Control and race it.
    //
    // `images/` and `video/` are excluded for a different reason: a developer's
    // local copy of the media sits in `public/`, so the build emits it, but it
    // is served from the media bucket. Shipping it here too would duplicate
    // the bytes into a bucket nothing reads them from.
    const root = new BucketDeployment(this, 'DeploySiteRoot', {
      ...shared,
      prune: false,
      sources: [
        Source.asset(sitePath, {
          exclude: [
            ...dotFiles,
            'assets',
            'assets/**',
            'images',
            'images/**',
            'video',
            'video/**',
            'blog',
            'blog/**',
          ],
        }),
      ],
      cacheControl: [
        CacheControl.setPublic(),
        CacheControl.maxAge(Duration.seconds(0)),
        CacheControl.mustRevalidate(),
      ],
      distribution,
      // Hashed assets are immutable and media is served from a stable URL, so
      // index.html and the blog's HTML are the only objects that ever need
      // evicting from the edge.
      distributionPaths: ['/index.html', '/blog/*'],
    });

    // The blog's images and CSS live in dist/assets, so publish those first.
    blog.node.addDependency(assets);

    // Upload the content index.html points at before publishing index.html, and
    // invalidate only once everything is in place.
    root.node.addDependency(assets, blog);

    new CfnOutput(this, 'ContactFunctionUrl', {
      value: fnUrl.url,
      description: 'Put in .env at the repo root as CONTACT_FN_URL for local dev',
    });
    new CfnOutput(this, 'DistributionId', { value: props.distributionId });
    new CfnOutput(this, 'SiteBucketName', { value: siteBucket.bucketName });
    new CfnOutput(this, 'MediaBucketName', {
      value: mediaBucket.bucketName,
      description: 'Upload images/ and video/ here — see cdk/scripts/media-push.sh',
    });
  }
}
