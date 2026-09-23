const board = document.getElementById('playgroundBoard');

if (board) {
  let activeItem = null;

  const moveItem = (item, x, y) => {
    const boardRect = board.getBoundingClientRect();
    const maxX = Math.max(0, boardRect.width - item.offsetWidth);
    const maxY = Math.max(0, boardRect.height - item.offsetHeight);

    item.style.left = `${Math.min(Math.max(0, x), maxX)}px`;
    item.style.top = `${Math.min(Math.max(0, y), maxY)}px`;
  };

  document.querySelectorAll('.scrap-item').forEach((item) => {
    item.addEventListener('dragstart', (event) => {
      activeItem = item;
      event.dataTransfer.setData('text/plain', item.dataset.role);
      event.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', () => {
      activeItem = null;
    });

    item.addEventListener('pointerdown', (event) => {
      activeItem = item;
      item.setPointerCapture?.(event.pointerId);
    });

    item.addEventListener('pointermove', (event) => {
      if (!activeItem || activeItem !== item) return;
      const boardRect = board.getBoundingClientRect();
      const offsetX = event.clientX - boardRect.left - item.offsetWidth / 2;
      const offsetY = event.clientY - boardRect.top - item.offsetHeight / 2;
      moveItem(item, offsetX, offsetY);
    });

    item.addEventListener('pointerup', () => {
      activeItem = null;
    });
  });

  board.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  });

  board.addEventListener('drop', (event) => {
    event.preventDefault();
    if (!activeItem) return;

    const rect = board.getBoundingClientRect();
    const x = event.clientX - rect.left - activeItem.offsetWidth / 2;
    const y = event.clientY - rect.top - activeItem.offsetHeight / 2;
    moveItem(activeItem, x, y);
  });

  const resetBoard = document.getElementById('resetBoard');
  if (resetBoard) {
    resetBoard.addEventListener('click', () => {
      document.querySelectorAll('.scrap-item').forEach((item, index) => {
        const positions = [
          { left: '10%', top: '12%' },
          { left: '52%', top: '18%' },
          { left: '62%', top: '52%' },
          { left: '16%', top: '58%' }
        ];
        const position = positions[index] || { left: '20%', top: '20%' };
        item.style.left = position.left;
        item.style.top = position.top;
      });
    });
  }

  const addNote = document.getElementById('addNote');
  if (addNote) {
    addNote.addEventListener('click', () => {
      const note = document.createElement('div');
      note.className = 'scrap-item quote-item';
      note.draggable = true;
      note.dataset.role = 'note';
      note.innerHTML = '<blockquote>«ذكريتي»</blockquote>';
      note.style.left = '38%';
      note.style.top = '42%';

      note.addEventListener('dragstart', (event) => {
        activeItem = note;
        event.dataTransfer.setData('text/plain', 'note');
      });

      note.addEventListener('dragend', () => {
        activeItem = null;
      });

      board.appendChild(note);
    });
  }
}
