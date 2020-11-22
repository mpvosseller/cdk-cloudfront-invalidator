# cdk-cloudfront-invalidator

An AWS CDK construct that can perform a CloudFront invalidation.

`CloudFrontInvalidator` performs an invalidation when it is first created and any time the `hash` property changes thereafter.

As an example you could perform a CloudFront invalidation any time a Lambda function changes by setting `hash` to `lambdaFunction.currentVersion.version`.

## Installation

```
npm add cdk-cloudfront-invalidator
```

## Usage

```typescript
import { CloudFrontInvalidator } from 'cdk-cloudfront-invalidator'
import * as cloudfront from '@aws-cdk/aws-cloudfront'

const webDistribution = new cloudfront.CloudFrontWebDistribution(this, 'WebDistribution', {
  //...
})

new CloudFrontInvalidator(this, 'CloudFrontInvalidator', {
  distributionId: webDistribution.distributionId,
  hash: '12345', // set to a string value that changes when you want to perform an invalidation
})
```
