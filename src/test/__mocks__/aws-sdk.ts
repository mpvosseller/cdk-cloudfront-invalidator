const awsSdk = jest.genMockFromModule<typeof import('aws-sdk')>('aws-sdk')

awsSdk.CloudFront.prototype.createInvalidation = jest.fn()

export = awsSdk
