const chai = require('chai')
    , expect = chai.expect;
const nock = require('nock');
const chaiAsPromised = require("chai-as-promised");
const chaiNock = require('chai-nock');
const { ReposAPI } = require('../databricks');
const { Headers } = require('node-fetch');

describe('Databricks tests', function () {
    chai.use(chaiAsPromised);
    chai.use(chaiNock);

    describe('getDatabricksRepoId tests', function () {
        const instanceName = "my-instance";
        const token = "my-token";
        const baseUrl = `https://${instanceName}.cloud.databricks.com`;
        const getRepoIdResponsePayload = {
            "repos": [
                {
                    "id": 1,
                    "path": "/Repos/production/my-repo",
                    "url": "https://github.com/my-user/my-repo.git",
                    "provider": "gitHub",
                    "branch": "main",
                    "head_commit_id": "dbaf792c6358be6e28da73faf478499185d8f7d0"
                },
                {
                    "id": 2,
                    "path": "/Repos/integration/my-repo",
                    "url": "https://github.com/my-user/my-repo.git",
                    "provider": "gitHub",
                    "branch": "integration",
                    "head_commit_id": "dbaf792c6358be6e28da73faf478499185d8f7d0"
                },
                {
                    "id": 3,
                    "path": "/Repos/staging/my-repo",
                    "url": "https://github.com/my-user/my-repo.git",
                    "provider": "gitHub",
                    "branch": "staging",
                    "head_commit_id": "dbaf792c6358be6e28da73faf478499185d8f7d0"
                },
            ]
        };

        it('should get production databricks repo ID', done => {

            const productionRepo = '/Repos/production/my-repo';

            nock(baseUrl)
                .get(`/api/2.0/repos?path_prefix=${productionRepo}`)
                .reply(200, getRepoIdResponsePayload);

            repos = new ReposAPI(instanceName, token);
            expect(repos.getDatabricksRepoId(productionRepo)).to.eventually.equal(1).notify(done);
        });

        it('should get staging databricks repo ID', done => {
            const stagingRepo = '/Repos/staging/my-repo';

            nock(baseUrl)
                .get(`/api/2.0/repos?path_prefix=${stagingRepo}`)
                .reply(200, getRepoIdResponsePayload);

            repos = new ReposAPI(instanceName, token);
            expect(repos.getDatabricksRepoId(stagingRepo)).to.eventually.equal(3).notify(done);
        });

        it('throw exception when repo prefix is not found', done => {
            const nonExistRepo = '/Repos/nonexist/my-repo';

            nock(baseUrl)
                .get(`/api/2.0/repos?path_prefix=${nonExistRepo}`)
                .reply(200, {});

            repos = new ReposAPI(instanceName, token);
            const rejectMessage = "Failed to get repo id: Repo path /Repos/nonexist/my-repo not found";
            expect(repos.getDatabricksRepoId(nonExistRepo)).to.be.rejectedWith(rejectMessage).notify(done);
        });

        it('should fill metadata correctly', () => {
            const productionRepo = "/Repos/production/my-repo";
            const requestNock = nock(baseUrl)
                .get(`/api/2.0/repos?path_prefix=${productionRepo}`)
                .reply(200, getRepoIdResponsePayload);

            repos = new ReposAPI(instanceName, token);
            repos.getDatabricksRepoId(productionRepo);

            const headers = new Headers();
            headers.append("authorization", `Bearer ${token}`)
            headers.append("Accept", "application/json")
            headers.append("Content-Type", "application/json")

            return expect(requestNock).to.have.been.requestedWithHeadersMatch(headers);
        });
    });

    describe('syncDatabricksRepo tests', function () {
        const instanceName = "my-instance";
        const token = "my-token";
        const baseUrl = `https://${instanceName}.cloud.databricks.com`;
        const databricksRepoId = 1;
        const repoBranch = "main";
        const repoTag = "v1.0.0";

        const syncgetRepoIdResponsePayload = {
            "id": 1,
            "url": "https://github.com/my-user/my-repo.git",
            "provider": "gitHub",
            "branch": "master",
            "head_commit_id": "d742706479c54028478a672ff4296d4d437bdd2a"
        };

        it('should sync Databricks repo using branch', done => {
            nock(baseUrl)
                .patch(`/api/2.0/repos/${databricksRepoId}`, JSON.stringify({ "branch": repoBranch }))
                .reply(200, syncgetRepoIdResponsePayload);

            repos = new ReposAPI(instanceName, token);
            expect(repos.syncDatabricksRepo(databricksRepoId, repoBranch, null)).to.eventually.equal("d742706").notify(done);
        });

        it('should sync Databricks repo using tag', done => {
            nock(baseUrl)
                .patch(`/api/2.0/repos/${databricksRepoId}`, JSON.stringify({ "tag": repoTag }))
                .reply(200, syncgetRepoIdResponsePayload);

            repos = new ReposAPI(instanceName, token);
            expect(repos.syncDatabricksRepo(databricksRepoId, null, repoTag)).to.eventually.equal("d742706").notify(done);
        });

        it('should throw due to lack of branch/tag', done => {
            repos = new ReposAPI(instanceName, token);
            const rejectMessage = "Must supply a branch or tag! Got branch null, tag null";
            expect(repos.syncDatabricksRepo(databricksRepoId)).to.be.rejectedWith(rejectMessage).notify(done);
        });

        it('should throw due to having both branch and tag', () => {
            repos = new ReposAPI(instanceName, token);
            const rejectMessage = `Must supply a branch or tag! Got branch ${repoBranch}, tag ${repoTag}`;
            return expect(repos.syncDatabricksRepo(databricksRepoId, repoBranch, repoTag)).to.be.rejectedWith(rejectMessage);
        });

        it('should throw due to repo not found', done => {
            nock(baseUrl)
                .patch(`/api/2.0/repos/${databricksRepoId}`, JSON.stringify({ "branch": repoBranch }))
                .reply(404, JSON.stringify({
                    "error_code": "RESOURCE_DOES_NOT_EXIST",
                    "message": "Repo could not be found"
                }));

            repos = new ReposAPI(instanceName, token);
            const rejectMessage = `Failed to sync databricks repo: 404 Repo could not be found`;
            expect(repos.syncDatabricksRepo(databricksRepoId, repoBranch, null)).to.be.rejectedWith(rejectMessage).notify(done);
        });

        it('should fill request metadata correctly', () => {
            const requestNock = nock(baseUrl)
                .patch(`/api/2.0/repos/${databricksRepoId}`)
                .reply(200, syncgetRepoIdResponsePayload);

            repos = new ReposAPI(instanceName, token);
            repos.syncDatabricksRepo(databricksRepoId, repoBranch, null);

            const headers = new Headers();
            headers.append("authorization", `Bearer ${token}`)
            headers.append("Accept", "application/json")
            headers.append("Content-Type", "application/json")

            return expect(requestNock).to.have.been.requestedWithHeadersMatch(headers);
        });
    });
});