import {BBTag} from './bbTag';
import {Token, Tokenizer, TokenType} from './tokenizer';

export enum TreeType { Root, Text, Tag }

export class BBCodeParseTree {
  isClosed: boolean;
  constructor(public treeType: TreeType, public content: string, public attributes?: Array<string>, public subTrees?: Array<BBCodeParseTree>) {
    this.subTrees = new Array<BBCodeParseTree>();
  }

  isValid() {
    //An tree without subtrees is valid
    if (this.subTrees.length == 0) {
      return true;
    }

    //An tree is valid if all of its subtrees are valid
    for (var currentTree of this.subTrees) {
      if (currentTree == null || !currentTree.isValid()) {
        return false;
      }
    }

    return true;
  }

  toString() {
    return TreeType[this.treeType] + " - " + this.content;
  }

  public static buildTree(str: string, bbTags: Array<BBTag>) {
    //Get the tokens
    var tokenizer = new Tokenizer(bbTags);
    var tokens = tokenizer.tokenizeString(str);

    //Build the tree
    return BBCodeParseTree.buildTreeFromTokens(
      new BBCodeParseTree(
        TreeType.Root,
        str),
      tokens.reverse());
  }

  private static buildTreeFromTokens(rootTree: BBCodeParseTree, tokens: Array<Token>, currentTag = ""): BBCodeParseTree {
    //The root root is invalid, return null
    if (rootTree == null) {
      return null;
    }

    //There are no more tokens, return the root
    if (tokens.length == 0) {
      return rootTree;
    }

    //Remove the first token
    var currentToken = tokens.pop();

    // currentTag.doesntRequireClose
    let doesntRequireClose = currentTag === "*";

    //Add the text token as a text parse tree
    switch (currentToken.tokenType) {
      case TokenType.Text: {
        rootTree.subTrees.push(new BBCodeParseTree(
          TreeType.Text,
          currentToken.content));
        break;
      }
      //Create a new tag tree and find its subtrees
      case TokenType.StartTag: {
        var tagName = currentToken.content;
        if (doesntRequireClose) {
          // leave the token..
          rootTree.isClosed = true;
          tokens.push(currentToken);
          return rootTree;
        }
        rootTree.subTrees.push(
          BBCodeParseTree.buildTreeFromTokens(
            new BBCodeParseTree(
              TreeType.Tag,
              tagName,
              currentToken.tagAttributes),
            tokens,
            tagName));
        break;
      }
      //Check if its the correct end tag
      case TokenType.EndTag: {
        var tagName = currentToken.content;
        if (doesntRequireClose) {
          rootTree.isClosed = true;
          tokens.push(currentToken);
          return rootTree;
        }

        if (tagName === currentTag) {
          rootTree.isClosed = true;
          return rootTree;
        }
        break;
      }
      default: {
        throw new Error("Unknown token type");
      }
    }

    //If we got no more tokens, and we have opened an tag but not closed it, return null
    if (tokens.length === 0) {
      if (currentTag !== "") {
        return rootTree;
      }
    }

    //Proceed to the next token
    return BBCodeParseTree.buildTreeFromTokens(rootTree, tokens, currentTag);
  }
}
