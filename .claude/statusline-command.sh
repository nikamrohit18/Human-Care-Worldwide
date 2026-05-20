#!/bin/sh
input=$(cat)

user=$(whoami)
host=$(hostname -s)
cwd=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // "~"')
model=$(echo "$input" | jq -r '.model.display_name // "Claude"')
remaining=$(echo "$input" | jq -r '.context_window.remaining_percentage // empty')

# Shorten home directory to ~
home="$HOME"
cwd_display="${cwd/#$home/\~}"

if [ -n "$remaining" ]; then
    printf '%s@%s %s | %s | context %s%% remaining' \
        "$user" "$host" "$cwd_display" "$model" "$(printf '%.0f' "$remaining")"
else
    printf '%s@%s %s | %s' \
        "$user" "$host" "$cwd_display" "$model"
fi
