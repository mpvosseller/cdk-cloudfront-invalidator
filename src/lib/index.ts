import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import { Construct, CustomResource, Duration } from '@aws-cdk/core'
import path from 'path'

export interface CloudFrontInvalidatorProps {
  distributionId: string
  hash: string
}

/**
 * Invalidates the cache of a CloudFront distribution any time hash changes
 */
export class CloudFrontInvalidator extends Construct {
  constructor(scope: Construct, id: string, props: CloudFrontInvalidatorProps) {
    super(scope, id)

    const lambdaFn = new lambda.SingletonFunction(this, 'Function', {
      uuid: 'B8817A1B-81A9-4B03-90A7-A0618D090BF3',
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      handler: 'index.handler',
      lambdaPurpose: 'CloudFrontInvalidator',
      initialPolicy: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['cloudfront:GetInvalidation', 'cloudfront:CreateInvalidation'],
          resources: ['*'],
        }),
      ],
      timeout: Duration.minutes(15),
    })

    new CustomResource(this, 'CustomResource', {
      serviceToken: lambdaFn.functionArn,
      resourceType: 'Custom::CloudFrontInvalidator',
      properties: {
        distributionId: props.distributionId,
        hash: `${props.hash}-${lambdaFn.currentVersion.version}`,
      },
    })
  }
}
