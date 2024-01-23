import React, {useState, useEffect, useRef} from 'react';
import { Editor, EditorState, RichUtils, Modifier, convertToRaw, convertFromRaw } from 'draft-js';

const TextEditor = () => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const editor = useRef(null);

  const styleMap = {
    'RED': {
      color: 'red'
    },
  };


  useEffect(() => {
    const savedContent = localStorage.getItem('editorContent');
    if (savedContent) {
      setEditorState(EditorState.createWithContent(convertFromRaw(JSON.parse(savedContent))));
    }
  }, []);

  const onChange = (newEditorState) => {
    const currentContent = newEditorState.getCurrentContent();
    const currentSelection = newEditorState.getSelection();
    const currentBlock = currentContent.getBlockForKey(currentSelection.getStartKey());

    if (newEditorState.getLastChangeType() === 'split-block' && currentBlock.getLength() === 0) {
      const newContentState = Modifier.setBlockType(currentContent, currentSelection, 'unstyled');
      const withoutInlineStyles = Modifier.removeInlineStyle(
          newContentState,
          currentSelection,
          currentBlock.getType(),
styleMap.RED
      );

      const clearedState = EditorState.push(newEditorState, withoutInlineStyles, 'change-block-type');
      setEditorState(EditorState.forceSelection(clearedState, clearedState.getSelection()));
    } else {
      setEditorState(newEditorState);
    }
  };


  const handleBeforeInput = (chars, editorState) => {
    const currentSelection = editorState.getSelection();
    if (chars !== ' ' || !currentSelection.isCollapsed()) {
      return 'not-handled';
    }
    const currentContent = editorState.getCurrentContent();
    const currentBlock = currentContent.getBlockForKey(currentSelection.getStartKey());
    const start = currentSelection.getStartOffset();
    const textBeforeCursor = currentBlock.getText().slice(0, start);

    if (textBeforeCursor.endsWith('***')) {
      return applyStyleAndRemoveCharacters(editorState, start, 3, 'UNDERLINE');
    } else if (textBeforeCursor.endsWith('**')) {
      return applyStyleAndRemoveCharacters(editorState, start, 2, 'RED');
    } else if (textBeforeCursor.endsWith('*')) {
      return applyStyleAndRemoveCharacters(editorState, start, 1, 'BOLD');
    } else if (textBeforeCursor.endsWith('#')) {
      return applyHeadingStyle(editorState, start);
    }
    return 'not-handled';
  };


  const applyStyleAndRemoveCharacters = (editorState, start, numCharsToRemove, style) => {
    const currentContent = editorState.getCurrentContent();
    const currentSelection = editorState.getSelection();

    const newContentState = Modifier.replaceText(
        currentContent,
        currentSelection.merge({ anchorOffset: start - numCharsToRemove, focusOffset: start }),
        ''
    );

    let styledState = EditorState.push(
        editorState,
        newContentState,
        'change-inline-style'
    );
    const currentStyles = editorState.getCurrentInlineStyle();

    currentStyles.forEach(style => {
      styledState = RichUtils.toggleInlineStyle(styledState, style);
    });

    styledState = RichUtils.toggleInlineStyle(styledState, style);

    setEditorState(styledState);
    return 'handled';
  };


  const applyHeadingStyle = (editorState, start) => {
    let currentContent = editorState.getCurrentContent();
    let selection = editorState.getSelection();

    // Remove the '#' character
    const targetRange = selection.merge({
      anchorOffset: start - 1,
      focusOffset: start,
    });
    let newContentState = Modifier.removeRange(currentContent, targetRange, 'backward');

    // Apply the 'header-one' block type
    const blockKey = selection.getStartKey();
    const blockMap = currentContent.getBlockMap();
    const block = blockMap.get(blockKey);
    const newBlock = block.merge({
      type: 'header-one',
      text: block.getText().slice(0, start - 1),
    });

    const newBlockMap = blockMap.set(blockKey, newBlock);
    newContentState = currentContent.merge({
      blockMap: newBlockMap,
      selectionAfter: selection,
    });

    // Reset inline styles for the new header block
    const entireBlockSelection = selection.merge({
      anchorOffset: 0,
      focusOffset: block.getLength(),
    });
    newContentState = Modifier.removeInlineStyle(
        newContentState,
        entireBlockSelection,
        'RED' // Add other styles here as needed
    );

    const newEditorState = EditorState.push(editorState, newContentState, 'change-block-type');
    setEditorState(newEditorState);

    return 'handled';
  };


  const myBlockStyleFn = (contentBlock) => {
    const type = contentBlock.getType();
    if (type === 'header-one') {
      return 'headerOneStyle';
    }
  };

  const saveContent = () => {
    const content = editorState.getCurrentContent();
    localStorage.setItem('editorContent', JSON.stringify(convertToRaw(content)));
    alert("Stored to Local")
  };

  return (
      <div className="editor-container">
        <div className="editor-toolbar">
          <span className="editor-name">Demo editor by Shrithan Devaiah</span>
          <button onClick={saveContent} className="save-button">Save</button>
        </div>
        <div className="editor-wrapper">
          <Editor
              ref={editor}
              placeholder="Write Here"
              handleBeforeInput={handleBeforeInput}
              editorState={editorState}
              customStyleMap={styleMap}
              blockStyleFn={myBlockStyleFn}
              onChange={onChange}
          />
        </div>
      </div>
);
};

export default TextEditor;
