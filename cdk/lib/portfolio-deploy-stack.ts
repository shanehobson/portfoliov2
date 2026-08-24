import * as path from 'path';
import { Stack, StackProps, Duration, Size } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
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

    const distribution = Distribution.fromDistributionAttributes(this, 'SiteDistribution', {
      distributionId: props.distributionId,
      domainName: props.distributionDomainName,
    });

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

    // Everything left at the root — index.html above all — must be revalidated
    // every time, or a deploy never reaches anyone holding a cached copy.
    // Pruning is off here: this deployment has no prefix to scope deletion to,
    // so pruning would delete the three prefixes above.
    const root = new BucketDeployment(this, 'DeploySiteRoot', {
      ...shared,
      prune: false,
      sources: [
        Source.asset(sitePath, {
          exclude: [...dotFiles, 'assets', 'assets/**', 'images', 'images/**', 'video', 'video/**'],
        }),
      ],
      cacheControl: [
        CacheControl.setPublic(),
        CacheControl.maxAge(Duration.seconds(0)),
        CacheControl.mustRevalidate(),
      ],
      distribution,
      // Hashed assets are immutable and media is served from a stable URL, so
      // index.html is the only object that ever needs evicting from the edge.
      distributionPaths: ['/index.html'],
    });

    // Upload the content index.html points at before publishing index.html, and
    // invalidate only once everything is in place.
    root.node.addDependency(assets, images, video);
  }
}
