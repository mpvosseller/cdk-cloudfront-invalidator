import * as cdk from '@aws-cdk/core';

export interface CloudfrontInvalidatorProps {
  // Define construct properties here
}

export class CloudfrontInvalidator extends cdk.Construct {

  constructor(scope: cdk.Construct, id: string, props: CloudfrontInvalidatorProps = {}) {
    super(scope, id);

    // Define construct contents here
  }
}
