const fetch = require("node-fetch");
class ReposAPI {
    #accessToken;
    #baseUrl;
    constructor(instancePrefix, accessToken) {
        this.#baseUrl = `https://${instancePrefix}.cloud.databricks.com/api/2.0/repos`;
        this.#accessToken = accessToken;
    }

    /**
     * Returns the Databricks repo ID based on a repo Path
     * @param  {[String]} repoPath     [Path present in Databricks UI. Eg. /Repos/production/my-repo]
     * @return {[String]}              [Databricks repo ID]
     */
    async getDatabricksRepoId(repoPath) {
        const getReposRequest = new fetch.Request(this.#baseUrl.concat(`?path_prefix=${repoPath}`), {
            method: "GET",
            headers: this.#buildHeaders(),
        });

        const response = await fetch(getReposRequest);

        try {
            const payload = await this.#handleResponse(response);
            return this.#parseRepoIdFromResponse(payload.repos || [], repoPath);
        } catch (err) {
            throw new Error(`Failed to get repo id: ${err}`);
        }
    }

    /**
     * Syncs a Databricks repo with either a branch or tag
     * @param  {[String]} repoId       [Databricks repo ID]
     * @param  {[String]} branch       [Branch name to be used in sync]
     * @param  {[String]} tag          [Tag to be used in sync]
     * @return {[undefined]}
     */
    async syncDatabricksRepo(repoId, branch = null, tag = null) {
        if ((branch === null && tag === null) || (branch != null && tag != null)) {
            throw new Error(`Must supply a branch or tag! Got branch ${branch}, tag ${tag}`);
        };

        const syncRequest = new fetch.Request(this.#baseUrl.concat(`/${repoId}`), {
            method: "PATCH",
            body: this.#buildSyncBody(branch, tag),
            headers: this.#buildHeaders(),
        });

        const response = await fetch(syncRequest);

        try {
            const payload = await this.#handleResponse(response);
            return payload["head_commit_id"].substring(0, 7);
        } catch (err) {
            throw new Error(`Failed to sync databricks repo: ${err}`);
        }
    }

    async #handleResponse(response) {
        var data = await response.json();
        if (!response.ok) {
            throw `${response.status} ${data.message}`;
        }
        return data;
    }

    #parseRepoIdFromResponse(repos, repoPath) {
        for (var x = 0; x < repos.length; x++) {
            if (repos[x]["path"] === repoPath) {
                return repos[x]["id"];
            }
        }
        throw `Repo path ${repoPath} not found`
    }

    #buildSyncBody(branch, tag) {
        var data = { "branch": branch }
        if (tag != null) {
            data = { "tag": tag }
        }
        return JSON.stringify(data)
    }

    #buildHeaders() {
        const headers = new fetch.Headers();

        headers.append("Authorization", `Bearer ${this.#accessToken}`)
        headers.append("Accept", "application/json")
        headers.append("Content-Type", "application/json")

        return headers
    }
}

module.exports = {
    ReposAPI: ReposAPI
}