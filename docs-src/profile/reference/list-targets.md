# zprf list-targets

List the targets `render` and `watch` can write.

```text
zprf list-targets
```

It takes no options apart from `-h` and `--help` and exits 0.

## Output

```text
ghostty    Ghostty    config file with colours, cursor and font settings  (ghostty/{id})
kitty      kitty      include file with colours, cursor and font settings  (kitty/{id}.conf)
wezterm    WezTerm    Lua module that applies colours and settings to a config  (wezterm/{id}.lua)
alacritty  Alacritty  TOML import with colours, cursor and font settings  (alacritty/{id}.toml)
tmux       tmux       status bar, pane border, message and copy mode colours  (tmux/{id}.tmux.conf)
neovim     Neovim     Lua colour scheme with Tree-sitter and diagnostic groups  (neovim/colors/{id}.lua)
vscode     VS Code    settings.json fragment with colour and token customisations  (vscode/{id}.settings.json)
```

Each line is the target name to give `--target`, the app, what the file is and where it is written
inside `--out`. `{id}` is the profile's id. `--target all` writes every one.

The [targets](/docs/profile/targets/) page lists what each target sets and the
[load in each app](/docs/profile/load-in-each-app/) page how to load each file.
