import * as cloudfront from '@aws-cdk/aws-cloudfront'
import * as s3 from '@aws-cdk/aws-s3'
import * as cdk from '@aws-cdk/core'
import { RemovalPolicy } from '@aws-cdk/core'
import { CloudFrontInvalidator } from 'cdk-cloudfront-invalidator'

export class ExampleStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const bucket = new s3.Bucket(this, 'Bucket', {
      websiteRedirect: {
        protocol: s3.RedirectProtocol.HTTPS,
        hostName: 'example.com',
      },
      removalPolicy: RemovalPolicy.DESTROY,
    })

    const webDistribution = new cloudfront.CloudFrontWebDistribution(this, 'WebDistribution', {
      defaultRootObject: '',
      originConfigs: [
        {
          customOriginSource: {
            domainName: bucket.bucketWebsiteDomainName,
            originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
          },
          behaviors: [
            {
              isDefaultBehavior: true,
            },
          ],
        },
      ],
    })

    new CloudFrontInvalidator(this, 'CloudFrontInvalidator', {
      distributionId: webDistribution.distributionId,
      hash: '12345',
    })
  }
}
