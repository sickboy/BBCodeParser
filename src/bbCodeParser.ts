import {Tokenizer, TokenType} from './tokenizer';
import {BBTag} from './bbTag';
import {BBCodeParseTree, TreeType} from './bbCodeParseTree';

var tagsToReplace = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;'
};

const escapeHTML = (html) =>
  html.replace(/[&<>]/g, (tag: string) => tagsToReplace[tag] || tag);

export class BBCodeParser {
  tagMap: { [key: string]: BBTag }
  //Creates a new parser with the given tags
  constructor(private bbTags: Array<BBTag>) {
    this.tagMap = {}
    bbTags.forEach(x => this.tagMap[x.tagName] = x);
  }

  public parseString(content: string, stripTags = false, insertLineBreak = true, escapingHtml = true) {
    //Create the parse tree
    var parseTree = BBCodeParseTree.buildTree(content, this.bbTags);

    //If the tree is invalid, return the input as text
    if (parseTree == null || !parseTree.isValid()) {
      return content;
    }

    //Convert it to HTML
    return this.treeToHtml(parseTree.subTrees, insertLineBreak, escapingHtml, stripTags);
  }

  private treeToHtml(subTrees: Array<BBCodeParseTree>, insertLineBreak: boolean, escapingHtml: boolean, stripTags = false) {
    var htmlString = "";
    var suppressLineBreak = false;

    subTrees.forEach(currentTree => {
      if (currentTree.treeType == TreeType.Text) {
        var textContent = currentTree.content;

        if (escapingHtml) {
          textContent = escapeHTML(textContent);
        }

        if (insertLineBreak && !suppressLineBreak) {
          textContent = textContent.replace(/(\r\n|\n|\r)/gm, "<br>");
          suppressLineBreak = false;
        }

        htmlString += textContent;
      } else {
        //Get the tag
        var bbTag = this.tagMap[currentTree.content];
        var content = this.treeToHtml(currentTree.subTrees, bbTag.insertLineBreaks, escapingHtml, stripTags);

        //Check if to strip the tags
        if (currentTree.isClosed && !stripTags) {
          htmlString += bbTag.markupGenerator(bbTag, content, currentTree.attributes);
        } else {
          htmlString += content;
        }

        suppressLineBreak = bbTag.suppressLineBreaks;
      }
    });

    return htmlString;
  }

  public static defaultTags(): Array<BBTag> {
    var bbTags = new Array<BBTag>();

    //Simple tags
    bbTags.push(new BBTag("b", true, false, false));
    bbTags.push(new BBTag("i", true, false, false));
    bbTags.push(new BBTag("u", true, false, false));

    bbTags.push(new BBTag("text", true, false, true, (tag, content, attr) => content));
    bbTags.push(new BBTag("img", true, false, false, (tag, content, attr) => `<img src="${content}" />`));

    bbTags.push(new BBTag("url", true, false, false, (tag, content, attr) => {
      var link = content;

      if (attr["url"] != undefined) {
        link = escapeHTML(attr["url"]);
      }

      if (!link.startsWith("http://") && !link.startsWith("https://")) {
        link = "http://" + link;
      }

      return `<a href="${link}" target="_blank">${content}</a>`;
    }));

    bbTags.push(new BBTag("code", true, false, true, (tag, content, attr) => {
      var lang = attr["lang"];

      return lang !== undefined
        ? `<code class="${escapeHTML(lang)}">${content}</code>`
        : `<code>${content}</code>`;
    }));

    return bbTags;
  }

  public static escapeHTML(content: string) {
    return escapeHTML(content);
  }
}
