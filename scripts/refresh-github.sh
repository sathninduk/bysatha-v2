#!/usr/bin/env bash
# Refresh js/github-data.js from GitHub using your local `gh` auth.
# The token never enters the website — this runs locally, output is public data only.
set -euo pipefail
cd "$(dirname "$0")/.."
TMP=$(mktemp -d)
for owner in sathninduk wolfigs chatsapi dpacks-technology project-evilcodes bysatha; do
  gh api "users/$owner/repos?per_page=100&type=owner" \
    --jq '.[] | select(.fork==false) | {name, owner: .owner.login, stars: .stargazers_count, forks: .forks_count, lang: .language, desc: .description, url: .html_url, pushed: .pushed_at}' 2>/dev/null
done > "$TMP/repos.jsonl"
gh api graphql -f query='{ user(login:"sathninduk"){ contributionsCollection { totalCommitContributions totalPullRequestContributions contributionCalendar { totalContributions weeks { contributionDays { contributionCount date } } } } }}' > "$TMP/contrib.json"
python3 - "$TMP" <<'EOF'
import json, sys, datetime
tmp = sys.argv[1]
d = json.load(open(f'{tmp}/contrib.json'))['data']['user']['contributionsCollection']
cal = d['contributionCalendar']
weeks = [[day['contributionCount'] for day in w['contributionDays']] for w in cal['weeks']]
repos = [json.loads(l) for l in open(f'{tmp}/repos.jsonl')]
total_stars = sum(r['stars'] for r in repos)
langs = {}
for r in repos:
    if r['lang']: langs[r['lang']] = langs.get(r['lang'], 0) + 1
top_langs = sorted(langs.items(), key=lambda x: -x[1])[:6]
by_stars = sorted([r for r in repos if r['stars'] > 0], key=lambda r: -r['stars'])[:6]
flagship_names = {('wolfigs','facet'),('wolfigs','gitparallax'),('wolfigs','inlay'),('wolfigs','wolfigs-web')}
flagship = [r for r in repos if (r['owner'], r['name']) in flagship_names]
seen, top_repos = set(), []
for r in by_stars + flagship:
    k = (r['owner'], r['name'])
    if k not in seen:
        seen.add(k); top_repos.append(r)
data = {
  "fetched": datetime.date.today().isoformat(),
  "login": "sathninduk",
  "profile": {"followers": 49, "publicRepos": 142, "sourceRepos": len(repos), "since": 2018},
  "contrib": {"lastYearTotal": cal['totalContributions'], "commits": d['totalCommitContributions'],
              "prs": d['totalPullRequestContributions'], "totalStars": total_stars, "weeks": weeks},
  "langs": [{"name": n, "count": c} for n, c in top_langs],
  "repos": [{"full": f"{r['owner']}/{r['name']}", "stars": r['stars'], "forks": r['forks'],
             "lang": r['lang'], "desc": (r['desc'] or '')[:110], "url": r['url']} for r in top_repos[:8]]
}
with open("js/github-data.js", 'w') as f:
    f.write("/* Auto-generated GitHub snapshot — refresh with scripts/refresh-github.sh */\n")
    f.write("const GH = " + json.dumps(data, indent=1) + ";\n")
print("refreshed js/github-data.js")
EOF
rm -rf "$TMP"
