const fetch = require("node-fetch");
const core = require('@actions/core');
const { parseBranchTag } = require('./utils');
const { ReposAPI } = require('./databricks');

async function run() {
    try {
        const account = core.getInput('account', { required: true });
        const accessToken = core.getInput('access-token', { required: true });
        const [branch, tag] = parseBranchTag(core.getInput('branch-tag'), { required: true });
        const repoPath = core.getInput('repo-path');
        var repoId = core.getInput('repo-id');

        repos = new ReposAPI(account, accessToken);

        if (repoId == '') {
            if (repoPath == '') {
                core.setFailed("Must supply a repo-id or repo-path!");
            } else {
                core.info("repo-path found. Getting Databricks repo ID");
                repoId = await repos.getDatabricksRepoId(repoPath);
            }
        } else {
            core.info("repo-id found. Using it to sync repo");
        }

        const branchOrTag = branch ?? tag;
        core.info(`Syncing Databricks repo with ${branchOrTag}`);
        const commit = await repos.syncDatabricksRepo(repoId, branch, tag);

        core.info(`Repo is now synced at commit ${commit}`);
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();