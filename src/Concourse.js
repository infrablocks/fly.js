import axios from 'axios'
import camelcaseKeysDeep from 'camelcase-keys-deep'

import { basicAuthHeader, bearerAuthHeader } from './http'
import {
  allBuildsUri,
  allPipelinesUri,
  authTokenUri,
  jobsUri,
  jobBuildsUri,
  pipelinesUri,
  buildsUri,
  pipelineBuildsUri
} from './uris'
import {
  boolean,
  integer,
  schemaFor,
  string,
  uri,
  validateOptions
} from './validation'

const buildsUriFor = (uri, teamName, pipelineName, jobName, team) => {
  if (jobName) {
    return jobBuildsUri(uri, teamName, pipelineName, jobName)
  } else if (pipelineName) {
    return pipelineBuildsUri(uri, teamName, pipelineName)
  } else if (team) {
    return buildsUri(uri, teamName)
  } else {
    return allBuildsUri(uri)
  }
}

export default class Concourse {
  constructor(options) {
    const validatedOptions = validateOptions(
      schemaFor({
        uri: uri().required(),
        teamName: string(),
        username: string(),
        password: string()
      }), options)

    this.uri = validatedOptions.uri
    this.teamName = validatedOptions.teamName
    this.username = validatedOptions.username
    this.password = validatedOptions.password
  }

  async login(options) {
    const validatedOptions = validateOptions(
      schemaFor({
        username: string().required(),
        password: string().required(),
        teamName: string()
      }), options)

    return new Concourse({
      uri: this.uri,
      teamName: validatedOptions.teamName || this.teamName,
      username: validatedOptions.username,
      password: validatedOptions.password
    })
  }

  async jobs(options) {
    const validatedOptions = validateOptions(
      schemaFor({
        pipeline: string().required()
      }), options)

    const { data: bearerAuthToken } = await axios
      .get(authTokenUri(this.uri, this.teamName), {
        headers: basicAuthHeader(this.username, this.password)
      })

    const { data: jobs } = await axios
      .get(jobsUri(this.uri, this.teamName, validatedOptions.pipeline), {
        headers: bearerAuthHeader(bearerAuthToken.value),
        transformResponse: [camelcaseKeysDeep]
      })

    return jobs
  }

  async pipelines(options = {}) {
    const validatedOptions = validateOptions(
      schemaFor({
        all: boolean()
      }), options)

    const { data: bearerAuthToken } = await axios
      .get(authTokenUri(this.uri, this.teamName), {
        headers: basicAuthHeader(this.username, this.password)
      })

    const uri = validatedOptions.all
      ? allPipelinesUri(this.uri)
      : pipelinesUri(this.uri, this.teamName)

    const { data: pipelines } = await axios
      .get(uri, {
        headers: bearerAuthHeader(bearerAuthToken.value),
        transformResponse: [camelcaseKeysDeep]
      })

    return pipelines
  }

  async builds(options = {}) {
    const jobRegex = /^(.*)\/(.*)$/

    const validatedOptions = validateOptions(
      schemaFor(
        {
          count: integer().min(1).allow(null).default(50),
          pipeline: string(),
          job: string().regex(jobRegex),
          team: boolean(),
        }).without('job', 'pipeline'), options)

    const { data: bearerAuthToken } = await axios
      .get(authTokenUri(this.uri, this.teamName), {
        headers: basicAuthHeader(this.username, this.password)
      })

    const pipelineName = validatedOptions.job
      ? jobRegex.exec(validatedOptions.job)[1]
      : validatedOptions.pipeline
    const jobName = validatedOptions.job
      ? jobRegex.exec(validatedOptions.job)[2]
      : undefined

    const uri = buildsUriFor(
      this.uri, this.teamName, pipelineName, jobName, validatedOptions.team)
    const headers = bearerAuthHeader(bearerAuthToken.value)
    const params = validatedOptions.count
      ? { limit: validatedOptions.count }
      : {}

    const { data: jobs } = await axios
      .get(uri, {
        headers,
        params,
        transformResponse: [camelcaseKeysDeep]
      })

    return jobs
  }
}
