import * as path from 'path';
import { Stack, StackProps, Duration, RemovalPolicy, Size } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Bucket } from 'aws-cdk-lib/aws-s3';
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
  PriceClass,
  S3OriginAccessControl,
  SSLMethod,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { BucketDeployment, Source, CacheControl } from 'aws-cdk-lib/aws-s3-deployment';

export interface PortfolioDeployStackProps extends StackProps {
  bucketName: string;
  distributionId: string;
  distributionDomainName: string;
  sourcePath: string;
}

export class PortfolioDeployStack extends Stack {
  constructor(scope: Construct, id: string, props: PortfolioDeployStackProps) {
    super(scope, id, props);

    const siteBucket = Bucket.fromBucketName(this, 'SiteBucket', props.bucketName);

    const distribution = Distribution.fromDistributionAttributes(this, 'SiteDistributionRef', {
      distributionId: props.distributionId,
      domainName: props.distributionDomainName,
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

    new Distribution(this, 'SiteDistribution', {
      defaultBehavior,
      additionalBehaviors: {
        '/blog': blogBehavior,
        '/blog/*': blogBehavior,
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

    // Images and video keep stable filenames, so they get a long-but-finite
    // max-age instead of `immutable`: re-uploading one at the same name still
    // refreshes, just not instantly.
    const mediaCacheControl = [
      CacheControl.setPublic(),
      CacheControl.maxAge(Duration.days(7)),
    ];

    const images = new BucketDeployment(this, 'DeploySiteImages', {
      ...shared,
      sources: [Source.asset(path.join(sitePath, 'images'), { exclude: dotFiles })],
      destinationKeyPrefix: 'images',
      cacheControl: mediaCacheControl,
    });

    const video = new BucketDeployment(this, 'DeploySiteVideo', {
      ...shared,
      sources: [Source.asset(path.join(sitePath, 'video'), { exclude: dotFiles })],
      destinationKeyPrefix: 'video',
      cacheControl: mediaCacheControl,
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
    // so pruning would delete the four prefixes above. For the same reason
    // every prefix that has its own deployment must be excluded, or this one
    // would also upload those files at the wrong Cache-Control and race it.
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
    root.node.addDependency(assets, images, video, blog);
  }
}
