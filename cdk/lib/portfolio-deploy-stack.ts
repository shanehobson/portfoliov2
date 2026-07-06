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

    new BucketDeployment(this, 'DeploySite', {
      sources: [
        Source.asset(path.resolve(__dirname, '..', props.sourcePath), {
          exclude: ['.DS_Store', '**/.DS_Store'],
        }),
      ],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ['/*'],
      prune: true,
      memoryLimit: 1024,
      ephemeralStorageSize: Size.mebibytes(1024),
      cacheControl: [
        CacheControl.setPublic(),
        CacheControl.maxAge(Duration.hours(1)),
      ],
    });
  }
}
