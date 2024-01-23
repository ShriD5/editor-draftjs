import React, { useState, useEffect, useRef } from 'react';
import { Editor, EditorState, RichUtils, Modifier, convertToRaw, convertFromRaw } from 'draft-js';
import 'draft-js/dist/Draft.css';

const TextEditor = () => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const editor = useRef(null);

  useEffect(() => {
    const savedContent = localStorage.getItem('editorContent');
    if (savedContent) {
      setEditorState(EditorState.createWithContent(convertFromRaw(JSON.parse(savedContent))));
    }
  }, []);

  useEffect(() => {
    if (editor.current) {
      editor.current.focus();
    }
  }, []);

  const styleMap = {
    'RED': {
      color: 'red'
    },
    // ... other styles
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
    }

    return 'not-handled';
  };

  const applyStyleAndRemoveCharacters = (editorState, start, numCharsToRemove, style) => {
    const currentContent = editorState.getCurrentContent();
    const currentSelection = editorState.getSelection();

    const newContentState = Modifier.replaceText(
        currentContent,
        currentSelection.merge({ anchorOffset: start - numCharsToRemove, focusOffset: start }),
        '',
        editorState.getCurrentInlineStyle(),
    );

    const newEditorState = EditorState.push(
        editorState,
        newContentState,
        'change-inline-style'
    );

    setEditorState(RichUtils.toggleInlineStyle(newEditorState, style));
    return 'handled';
  };

  const onChange = (newEditorState) => {
    const currentContent = newEditorState.getCurrentContent();
    const currentSelection = newEditorState.getSelection();
    const key = currentSelection.getStartKey();
    const block = currentContent.getBlockForKey(key);
    const text = block.getText();

    if (text.startsWith('# ') && currentSelection.isCollapsed() && block.getLength() === 2) {
      const blockType = block.getType();
      if (blockType !== 'header-one') {
        setEditorState(RichUtils.toggleBlockType(newEditorState, 'header-one'));
      } else {
        setEditorState(newEditorState);
      }
    } else {
      setEditorState(newEditorState);
    }
  };

  const saveContent = () => {
    const content = editorState.getCurrentContent();
    localStorage.setItem('editorContent', JSON.stringify(convertToRaw(content)));
  };

  return (
      <div className="editor-container">
        <div className="editor-toolbar">
          <button onClick={saveContent} className="save-button">Save</button>
        </div>
        <div className="editor-wrapper">
          <Editor
              ref={editor}
              placeholder="Write Here"
              handleBeforeInput={handleBeforeInput}
              editorState={editorState}
              customStyleMap={styleMap}
              onChange={onChange}
          />
        </div>
      </div>
  );
};

export default TextEditor;
