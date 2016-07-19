﻿export class BBTag {
  public noEndTag: boolean;
  constructor(
    public tagName: string, //The name of the tag
    public insertLineBreaks: boolean, //Indicates if line breaks are inserted inside the tag content
    public suppressLineBreaks: boolean, //Suppresses any line breaks for nested tags
    public noNesting: boolean, //Indicates if the tag supports nested tags
    public markupGenerator?: (tag: BBTag, content: string, attr: Array<string>) => string) {
    //If no generator is defined, use the default one
    if (markupGenerator == undefined) {
      this.markupGenerator = (tag, content, attr) => `<${tag.tagName}>${content}</${tag.tagName}>`
    }
  }

  public static createSimpleTag(tagName: string, insertLineBreaks: boolean = true, targetTagName = undefined) {
    return targetTagName
      ? new BBTag(tagName, insertLineBreaks, false, false, (tag: BBTag, content: string, attr: Array<string>) => `<${targetTagName}>${content}</${targetTagName}>`)
      : new BBTag(tagName, insertLineBreaks, false, false);
  }

  public static createTag(tagName: string, markupGenerator: (tag: BBTag, content: string, attr: Array<string>) => string, insertLineBreaks: boolean = true) {
    return new BBTag(tagName, insertLineBreaks, false, false, markupGenerator);
  }
}
