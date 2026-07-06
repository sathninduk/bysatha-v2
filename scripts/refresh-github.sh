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
# contribution calendar: GraphQL caps each query at 1 year, so pull
# five 1-year windows and merge them into a 5-year field
python3 -c "
import datetime
t = datetime.date.today()
for i in range(5):
    print((t.replace(year=t.year-i-1) + datetime.timedelta(days=1)).isoformat() + 'T00:00:00Z',
          t.replace(year=t.year-i).isoformat() + 'T23:59:59Z')
" | while read -r FROM TO; do
  gh api graphql \
    -f query='query($from:DateTime!,$to:DateTime!){ user(login:"sathninduk"){ contributionsCollection(from:$from,to:$to){ totalCommitContributions totalPullRequestContributions contributionCalendar { totalContributions weeks { contributionDays { contributionCount date } } } } }}' \
    -F from="$FROM" -F to="$TO"
  printf '\n'
done > "$TMP/contrib.jsonl"
python3 - "$TMP" <<'EOF'
import json, sys, datetime
tmp = sys.argv[1]
windows = [json.loads(l)['data']['user']['contributionsCollection']
           for l in open(f'{tmp}/contrib.jsonl') if l.strip()]
# windows[0] is the most recent year — keep its headline stats
d = windows[0]
cal = d['contributionCalendar']
# merge all windows into one date→count map, then rebuild weeks
day_map = {}
for w in windows:
    for wk in w['contributionCalendar']['weeks']:
        for day in wk['contributionDays']:
            day_map[day['date']] = day['contributionCount']
dates = sorted(day_map)
first = datetime.date.fromisoformat(dates[0])
first_sunday = first - datetime.timedelta(days=(first.weekday() + 1) % 7)
last = datetime.date.fromisoformat(dates[-1])
n_weeks = (last - first_sunday).days // 7 + 1
weeks = [[0] * 7 for _ in range(n_weeks)]
for ds, count in day_map.items():
    dt = datetime.date.fromisoformat(ds)
    off = (dt - first_sunday).days
    weeks[off // 7][off % 7] = count
five_year_total = sum(day_map.values())
start_date = first_sunday.isoformat()
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
              "prs": d['totalPullRequestContributions'], "totalStars": total_stars,
              "fiveYearTotal": five_year_total, "start": start_date, "weeks": weeks},
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
