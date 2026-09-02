#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PortfolioDeployStack } from '../lib/portfolio-deploy-stack';
import { localConfig } from '../config.local';

const app = new cdk.App();

new PortfolioDeployStack(app, 'PortfolioDeployStack', {
  env: {
    account: localConfig.account,
    region: 'us-east-2',
  },
  bucketName: 'shanehobson.me',
  distributionId: 'EEN9EO2INB4OB',
  distributionDomainName: 'd39x5co18flpx4.cloudfront.net',
  sourcePath: '../dist',
});
