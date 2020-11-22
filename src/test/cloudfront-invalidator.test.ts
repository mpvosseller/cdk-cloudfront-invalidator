import { countResources, expect as expectCDK } from '@aws-cdk/assert'
import * as cdk from '@aws-cdk/core'
import * as cfi from '../lib/index'

test('creates one lambda function and one custom resource', () => {
  const app = new cdk.App()
  const stack = new cdk.Stack(app, 'TestStack')
  new cfi.CloudFrontInvalidator(stack, 'MyTestConstruct', {
    distributionId: 'someDistributionId',
    hash: '12345',
  })
  expectCDK(stack).to(countResources('AWS::Lambda::Function', 1))
  expectCDK(stack).to(countResources('Custom::CloudFrontInvalidator', 1))
})
