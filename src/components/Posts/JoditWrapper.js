import { Component, createRef } from 'inferno'

const { Jodit } = await import('jodit-inferno')
const JoditEditor = (await import('jodit-inferno')).default

// JoditWrapper expects:
// `updateValue` function (updates a variable that contains the content of the editor).
// `value` variable representing the current editor value.
export default class JoditWrapper extends Component {
  constructor (props) {
    super(props)

    this.editor = createRef()
    this.handleBlur = this.handleBlur.bind(this)
  }

  handleBlur (newValue) {
    this.props.updateValue(newValue)
  }

  render () {
    return (
      <JoditEditor
        config={joditConfig}
        ref={this.editor}
        value={this.props.value}
        onBlur={this.handleBlur}
      />
    )
  }
}

const joditConfig = {
  inline: true,
  toolbar: false,
  toolbarInline: true,
  toolbarInlineForSelection: true,
  popup: {
    selection: Jodit.atom([
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'superscript',
      'subscript',
      'ul',
      'ol',
      'paragraph',
      'table',
      'link',
      'spellcheck'
    ])
  },
  showXPathInStatusbar: false,
  showCharsCounter: true,
  showWordsCounter: true,
  addNewLine: false
}
