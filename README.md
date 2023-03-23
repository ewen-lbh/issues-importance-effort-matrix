# Issues' Importance-Effort Matrix

One day I was looking at issues and I wanted to sort them by the most important first.

But I also wanted to see the ones that are the most easy/fast to close.

Turns out both is good.



> **Warning** This is _very_ WIP

## Installation

You'll need [`npm`](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) and [`git`](https://git-scm.com) installed

```
git clone https://github.com/ewen-lbh/issuesmatrix
cd issuesmatrix
npm i
```



## Usage

### Launch

```
npm run dev
```

Then open the URL that's given to you in the terminal.

### First-time

Go to `/A_NAME?git=URL_TO_A_GITHUB_OR_GITLAB_REPO`

Replacing:
- `A_NAME` with any given name you like. It will use (and create if non-existent) a save file at `~/.local/share/issuesmatrix/A_NAME.json`)
- `URL_TO_A_GITHUB_OR_GITLAB_REPO` with a URL to a repo. Supported hosts are github (needs [`gh`](https://cli.github.com)) and gitlab (needs [`glab`](https://gitlab.com/gitlab-org/cli/)). Note that any gitlab instance is supported, not just gitlab.com.

The issues will all be on the diagonal at first. To sort them, toggle to the sorting view by clicking the checkbox on the bottom left of the page (yes, that big square is a checkbox, I told you this is WIP software).

The save file will be updated on each reorder, and toggling between the two views.

### Other times

The url to the repo will be stored in the save file, so you can go to `/A_NAME`.
