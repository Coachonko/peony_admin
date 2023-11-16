import { linkEvent } from 'inferno'

export default function Metadata ({ lastError, updateLastError, sortedMetadata, updateSortedMetadata }) {
  const metadataGroup = []
  for (let i = 0; i < sortedMetadata.length; i++) {
    const item = sortedMetadata[i]
    const key = Object.keys(item)[0]
    const value = Object.values(item)[0]
    metadataGroup.push(
      <div>
        <input
          name={key}
          type='text'
          spellCheck='false'
          autoComplete='off'
          value={key}
          onInput={linkEvent({ updateLastError, sortedMetadata, updateSortedMetadata, i }, handleMetadataKeyChange)}
          onFocusOut={linkEvent({ updateLastError, sortedMetadata, i }, handleMetadataKeyValidation)}
        />
        <input
          name={value}
          type='text'
          spellCheck='false'
          autoComplete='off'
          value={value}
          onInput={linkEvent({ sortedMetadata, updateSortedMetadata, i }, handleMetadataValueChange)}
        />
        <button
          name={key}
          type='button'
          onClick={linkEvent({ sortedMetadata, updateSortedMetadata, i }, handleRemoveMetadataPair)}
        >
          Remove
        </button>
      </div>
    )
  }
  const metadata = (
    <>
      {metadataGroup}
      <div>
        <button
          type='button'
          onClick={linkEvent({ sortedMetadata, updateSortedMetadata }, handleAddMetadataPair)}
        >
          Add
        </button>
      </div>
    </>
  )
  return metadata
}

function handleAddMetadataPair ({ sortedMetadata, updateSortedMetadata }) {
  const baseKey = 'new key '
  let keyCounter = 1
  while (sortedMetadata.some(item => Object.keys(item)[0] === `${baseKey}${keyCounter}`)) {
    keyCounter++
  }

  const newKey = `${baseKey}${keyCounter}`

  const updatedMetadata = [...sortedMetadata, { [newKey]: 'new value' }]

  updateSortedMetadata(updatedMetadata)
}

function handleRemoveMetadataPair ({ sortedMetadata, updateSortedMetadata, i }, event) {
  const updatedMetadata = sortedMetadata.filter((item, index) => index !== i)
  updateSortedMetadata(updatedMetadata)
}

function handleMetadataKeyChange ({ updateLastError, sortedMetadata, updateSortedMetadata, i }, event) {
  const { value } = event.target

  if (sortedMetadata.some(item => Object.keys(item)[0] === value)) {
    const error = new Error(`A key named ${value} already exists in metadata`)
    updateLastError(error)
  }

  const updatedMetadata = sortedMetadata.map((item, index) => {
    const key = Object.keys(item)[0]
    if (index === i) {
      return { [value]: item[key] }
    }
    return item
  })

  updateSortedMetadata(updatedMetadata)
}

// TODO use this function to display the error in the input field and disable the save button
function handleMetadataKeyValidation ({ updateLastError, sortedMetadata, i }, event) {
  const { value } = event.target
  if (sortedMetadata.some((item, index) => index !== i && Object.keys(item)[0] === value)) {
    const error = new Error(`A key named ${value} already exists in metadata`)
    updateLastError(error)
  }
}

function handleMetadataValueChange ({ sortedMetadata, updateSortedMetadata, i }, event) {
  const { value } = event.target

  const updatedMetadata = sortedMetadata.map((item, index) => {
    const key = Object.keys(item)[0]
    if (index === i) {
      return { [key]: value }
    }
    return item
  })

  updateSortedMetadata(updatedMetadata)
}
