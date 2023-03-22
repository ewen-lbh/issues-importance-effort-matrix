#!/usr/bin/env python
from pathlib import Path
import json
import re
from typing import Literal, NamedTuple, TypeVar
from subprocess import run

repo = input("glab -R ").lower() or "git.inpt.fr/inp-net/loca7"

class Issue(NamedTuple):
  number: int
  url: str
  title: str
  
  def __str__(self) -> str:
    return f"#{self.number} ({self.title})"

TAB = "\t"
issues_raw: list[str] = run(["glab", "issue", "list", "-R", repo, "-P", "100"], capture_output=True).stdout.decode("utf-8").split("\n")
issues: list[Issue] = [
  Issue(
    number=int(issue.split(TAB)[0].replace("#", "")),
    title=issue.split(TAB)[2],
    url=f"https://{repo}/-/issues/{issue.split(TAB)[0].replace('#', '')}"
  ) for issue in issues_raw if issue.startswith('#')
]

data: dict[str, list[dict[Literal["effort", "importance"], list[int]]]] = json.loads(Path("/home/ewen/.local/share/issuematrix.json").read_text())

data[repo] = {
  "importance": list(reversed(data[repo]["importance"])),
  "effort": list(reversed(data[repo]["effort"]))
}
Path("/home/ewen/.local/share/issuematrix.json").write_text(json.dumps(data, indent=2))

exit()



T = TypeVar("T")
def compare(a: T, b: T, criteria: str):
  if "n" not in input(f"{a} {criteria} {b} (y/n)>").strip().lower():
    return True
  return False

T= TypeVar("T")
def quicksort(issues: list[T], criteria: str) -> list[T]:
  if len(issues) <= 1:
    return issues
  pivot = issues[0]
  lower, pivots, higher = [], [], []
  for element in issues:
    if element == pivot: pivots.append(element)
    elif compare(element, pivot, criteria):
      higher.append(element)
    else:
      lower.append(element)
  return quicksort(lower, criteria) + pivots + quicksort(higher, criteria)

importance = quicksort(issues, "more important")
effort = quicksort(issues, "easier")

data[repo] = {
  "importance": [issue.number for issue in importance],
  "effort": [issue.number for issue in effort]
}

Path("/home/ewen/.local/share/issuematrix.json").write_text(json.dumps(data, indent=2))
