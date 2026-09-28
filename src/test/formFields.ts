import ts from 'typescript'

/**
 * Finds the form fields in a component's source that the browser has no name for
 * (UI-69 in wiki/interface.md).
 *
 * Chrome's Issues panel raises "A form field element should have an id or name
 * attribute" for every `<input>`, `<select>` and `<textarea>` with neither, and its
 * autofill cannot tell such boxes apart. `formFields.test.ts` runs this over every
 * component, so a new box without a name fails a test rather than turning up in
 * the browser later.
 *
 * The source is read with TypeScript's own parser rather than a pattern: a JSX
 * tag holds arrow functions, nested braces and comments, none of which a regular
 * expression reliably finds the end of.
 */

/** Where an unnamed form field is, for a failure message that leads to it. */
export interface UnnamedFormField {
  /** The file as it was given. */
  readonly file: string
  /** 1-based, as editors count. */
  readonly line: number
  /** `input`, `select` or `textarea`. */
  readonly tag: string
}

const FIELD_TAGS: ReadonlySet<string> = new Set(['input', 'select', 'textarea'])

const NAMING_ATTRIBUTES: ReadonlySet<string> = new Set(['name', 'id'])

/**
 * Every `<input>`, `<select>` and `<textarea>` in `source` without a `name` or an
 * `id`, in the order they appear. A tag with a spread (`{...props}`) may be named by
 * it and is trusted.
 */
export function unnamedFormFields(file: string, source: string): UnnamedFormField[] {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const found: UnnamedFormField[] = []

  const visit = (node: ts.Node): void => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(sourceFile)
      if (FIELD_TAGS.has(tag) && !isNamed(node.attributes, sourceFile)) {
        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
        found.push({ file, line: line + 1, tag })
      }
    }
    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return found
}

function isNamed(attributes: ts.JsxAttributes, sourceFile: ts.SourceFile): boolean {
  return attributes.properties.some(
    (property) =>
      ts.isJsxSpreadAttribute(property) ||
      (ts.isJsxAttribute(property) && NAMING_ATTRIBUTES.has(property.name.getText(sourceFile))),
  )
}

/** One line per field, `file:line <tag>`, for reading in a failure. */
export function describeUnnamedFormFields(fields: readonly UnnamedFormField[]): string[] {
  return fields.map((field) => `${field.file}:${String(field.line)} <${field.tag}>`)
}
