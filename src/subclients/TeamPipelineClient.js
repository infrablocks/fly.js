import {
  func,
  object,
  schemaFor,
  string,
  uri,
  validateOptions
} from '../support/validation'
import { teamPipelineJobsUrl, teamPipelineJobUrl } from '../support/urls'
import { parseJson } from '../support/http/transformers'
import camelcaseKeysDeep from 'camelcase-keys-deep'
import TeamPipelineJobClient from './TeamPipelineJobClient'

class TeamPipelineClient {
  constructor (options) {
    const validatedOptions = validateOptions(
      schemaFor({
        apiUrl: uri().required(),
        httpClient: func().required(),
        team: object().required(),
        pipeline: object().required()
      }), options)

    this.apiUrl = validatedOptions.apiUrl
    this.httpClient = validatedOptions.httpClient
    this.team = validatedOptions.team
    this.pipeline = validatedOptions.pipeline
  }

  async listJobs () {
    const { data: jobs } = await this.httpClient
      .get(
        teamPipelineJobsUrl(this.apiUrl, this.team.name, this.pipeline.name),
        { transformResponse: [parseJson, camelcaseKeysDeep] })

    return jobs
  }

  async getJob (jobName) {
    const validatedOptions = validateOptions(
      schemaFor({
        jobName: string().required()
      }), { jobName })

    const { data: job } = await this.httpClient
      .get(
        teamPipelineJobUrl(
          this.apiUrl,
          this.team.name,
          this.pipeline.name,
          validatedOptions.jobName),
        { transformResponse: [parseJson, camelcaseKeysDeep] })

    return job
  }

  async forJob (jobName) {
    let job
    try {
      job = await this.getJob(jobName)
    } catch (e) {
      if (e.response && e.response.status === 404) {
        throw new Error(`No job for name: ${jobName}`)
      } else {
        throw e
      }
    }

    return new TeamPipelineJobClient({
      apiUrl: this.apiUrl,
      httpClient: this.httpClient,
      team: this.team,
      pipeline: this.pipeline,
      job
    })
  }
}

export default TeamPipelineClient