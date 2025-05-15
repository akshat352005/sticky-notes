(() => {
  const notesContainer = document.getElementById('notesContainer');
  const addNoteBtn = document.getElementById('addNoteBtn');

  // Generate unique ID for notes
  const generateId = () => '_' + Math.random().toString(36).substr(2, 9);

  // Save notes to localStorage so they persist on reload
  const saveNotes = () => {
    const notes = [];
    document.querySelectorAll('.note').forEach(note => {
      notes.push({
        id: note.dataset.id,
        content: note.querySelector('.content').innerText,
        left: note.style.left,
        top: note.style.top,
        color: note.style.backgroundColor,
      });
    });
    localStorage.setItem('stickyNotesData', JSON.stringify(notes));
  };

  // Load notes from localStorage
  const loadNotes = () => {
    const notes = JSON.parse(localStorage.getItem('stickyNotesData') || '[]');
    notes.forEach(noteData => {
      createNote(noteData.content, noteData.left, noteData.top, noteData.color, noteData.id);
    });
  };

  // Create a sticky note element
  const createNote = (content = '', left = '20px', top = '20px', color = '', id = null) => {
    const note = document.createElement('div');
    note.classList.add('note');
    note.dataset.id = id || generateId();

    note.style.left = left;
    note.style.top = top;

    if(color) {
      note.style.backgroundColor = color;
    } else {
      // Random pastel color for note background
      const pastelColors = ['#ffd790', '#ff7171', '#9fffe0', '#ffee93', '#c7ceea', '#bcf5ff'];
      note.style.backgroundColor = pastelColors[Math.floor(Math.random() * pastelColors.length)];
    }

    note.setAttribute('tabindex', '0');
    note.setAttribute('aria-label', 'Sticky Note');

    const contentDiv = document.createElement('div');
    contentDiv.classList.add('content');
    contentDiv.textContent = content || 'New Note';
    contentDiv.setAttribute('contenteditable', 'false');
    contentDiv.setAttribute('aria-multiline', 'true');
    contentDiv.setAttribute('spellcheck', 'false');

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('delete-btn');
    deleteBtn.innerHTML = '&times;';
    deleteBtn.setAttribute('aria-label', 'Delete note');

    note.appendChild(contentDiv);
    note.appendChild(deleteBtn);
    notesContainer.appendChild(note);

    // Add event listeners
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      note.remove();
      saveNotes();
    });

    // Toggle edit mode on double-click or Enter key when focused
    note.addEventListener('dblclick', () => {
      toggleEdit(note, contentDiv);
    });

    note.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && document.activeElement === note) {
        e.preventDefault();
        toggleEdit(note, contentDiv);
      }
      if(e.key === 'Escape' && contentDiv.isContentEditable) {
        e.preventDefault();
        toggleEdit(note, contentDiv, true);
      }
    });

    // Save on blur if editing
    contentDiv.addEventListener('blur', () => {
      if(contentDiv.isContentEditable) {
        toggleEdit(note, contentDiv, true);
      }
    });

    // Drag and drop logic variables
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    const onMouseDown = (e) => {
      if(e.target === contentDiv) return; // don't drag when editing text
      isDragging = true;
      dragOffsetX = e.clientX - note.getBoundingClientRect().left;
      dragOffsetY = e.clientY - note.getBoundingClientRect().top;
      note.style.cursor = 'grabbing';
      note.style.zIndex = 1000;
      e.preventDefault();
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      let newLeft = e.clientX - dragOffsetX;
      let newTop = e.clientY - dragOffsetY;

      // Boundary checks within container
      const containerRect = notesContainer.getBoundingClientRect();
      const noteRect = note.getBoundingClientRect();
      if(newLeft < 0) newLeft = 0;
      if(newTop < 0) newTop = 0;
      if(newLeft + noteRect.width > containerRect.width) newLeft = containerRect.width - noteRect.width;
      if(newTop + noteRect.height > containerRect.height) newTop = containerRect.height - noteRect.height;

      note.style.left = newLeft + 'px';
      note.style.top = newTop + 'px';
    };

    const onMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        note.style.cursor = 'grab';
        note.style.zIndex = '';
        saveNotes();
      }
    };

    note.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    // For touch devices
    note.addEventListener('touchstart', (e) => {
      if(e.target === contentDiv) return;
      const touch = e.touches[0];
      isDragging = true;
      dragOffsetX = touch.clientX - note.getBoundingClientRect().left;
      dragOffsetY = touch.clientY - note.getBoundingClientRect().top;
      note.style.cursor = 'grabbing';
      note.style.zIndex = 1000;
      e.preventDefault();
    }, {passive:false});

    document.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      let newLeft = touch.clientX - dragOffsetX;
      let newTop = touch.clientY - dragOffsetY;
      const containerRect = notesContainer.getBoundingClientRect();
      const noteRect = note.getBoundingClientRect();
      if(newLeft < 0) newLeft = 0;
      if(newTop < 0) newTop = 0;
      if(newLeft + noteRect.width > containerRect.width) newLeft = containerRect.width - noteRect.width;
      if(newTop + noteRect.height > containerRect.height) newTop = containerRect.height - noteRect.height;
      note.style.left = newLeft + 'px';
      note.style.top = newTop + 'px';
      e.preventDefault();
    }, {passive:false});

    document.addEventListener('touchend', () => {
      if(isDragging) {
        isDragging = false;
        note.style.cursor = 'grab';
        note.style.zIndex = '';
        saveNotes();
      }
    });

    return note;
  };

  // Toggle edit mode, saveContent indicates if save mode (exit editing)
  const toggleEdit = (note, contentDiv, saveContent=false) => {
    if(saveContent) {
      // Exit edit mode
      contentDiv.setAttribute('contenteditable', 'false');
      note.style.cursor = 'grab';
      contentDiv.blur();
      saveNotes();
    } else {
      // Enter edit mode
      contentDiv.setAttribute('contenteditable', 'true');
      contentDiv.focus();
      // Move cursor to the end
      document.execCommand('selectAll', false, null);
      document.getSelection().collapseToEnd();
      note.style.cursor = 'text';
    }
  };

  addNoteBtn.addEventListener('click', () => {
    const note = createNote('', '30px', '30px');
    // Focus newly created note
    const contentDiv = note.querySelector('.content');
    toggleEdit(note, contentDiv);
    saveNotes();
  });

  // Load notes on page load
  window.addEventListener('load', () => {
    loadNotes();
  });
})();
