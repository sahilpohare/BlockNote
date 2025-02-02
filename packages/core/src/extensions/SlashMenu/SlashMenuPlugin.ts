import { Plugin, PluginKey } from "prosemirror-state";

import type { BlockNoteEditor } from "../../editor/BlockNoteEditor";
import {
  SuggestionsMenuState,
  setupSuggestionsMenu,
} from "../../extensions-shared/suggestion/SuggestionPlugin";
import { BlockSchema, InlineContentSchema, StyleSchema } from "../../schema";
import { EventEmitter } from "../../util/EventEmitter";
import { BaseSlashMenuItem } from "./BaseSlashMenuItem";

export const slashMenuPluginKey = new PluginKey("SlashMenuPlugin");

export class SlashMenuQuery<
  BSchema extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
  SlashMenuItem extends BaseSlashMenuItem<BSchema, I, S>
> {
  constructor(public queryChar: string = "/") {}

  async query(q: string, items: SlashMenuItem[]): Promise<SlashMenuItem[]> {
    return items.filter(
      ({ name, aliases }: SlashMenuItem) =>
        name.toLowerCase().startsWith(q.toLowerCase()) ||
        (aliases &&
          aliases.filter((alias) =>
            alias.toLowerCase().startsWith(q.toLowerCase())
          ).length !== 0)
    );
  }

  async execute({
    item,
    editor,
  }: {
    item: SlashMenuItem;
    editor: BlockNoteEditor<BSchema, I, S>;
  }) {
    console.log("execute", item);
    return item.execute(editor);
  }
}

export class SlashMenuProsemirrorPlugin<
  BSchema extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
  SlashMenuItem extends BaseSlashMenuItem<BSchema, I, S>
> extends EventEmitter<any> {
  public readonly plugin: Plugin;
  public readonly itemCallback: (item: SlashMenuItem) => void;

  constructor(
    editor: BlockNoteEditor<BSchema, I, S>,
    items: SlashMenuItem[],
    queryManager: SlashMenuQuery<
      BSchema,
      I,
      S,
      SlashMenuItem
    > = new SlashMenuQuery()
  ) {
    super();

    console.log("SlashMenuProsemirrorPlugin", queryManager);
    const suggestions = setupSuggestionsMenu<SlashMenuItem, BSchema, I, S>(
      editor,
      (state) => {
        this.emit("update", state);
      },
      slashMenuPluginKey,
      queryManager.queryChar,
      (query) => queryManager.query(query, items),
      ({ item, editor }) => queryManager.execute({ item, editor })
    );
    this.plugin = suggestions.plugin;
    this.itemCallback = suggestions.itemCallback;
  }

  public onUpdate(
    callback: (state: SuggestionsMenuState<SlashMenuItem>) => void
  ) {
    return this.on("update", callback);
  }
}
