#!/usr/bin/env node
import * as cdk from '@aws-cdk/core'
import 'source-map-support/register'
import { ExampleStack } from '../lib/example-stack'

const app = new cdk.App()
new ExampleStack(app, 'ExampleStack')
