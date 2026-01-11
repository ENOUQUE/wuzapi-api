// Additional message sending functions for Alfa API Dashboard

// Ensure baseUrl is available (from app.js)
if (typeof baseUrl === 'undefined') {
  var baseUrl = window.location.origin;
}

// Helper functions (if not already defined in app.js)
if (typeof showError === 'undefined') {
  function showError(message) {
    alert(message);
  }
}

if (typeof generateMessageUUID === 'undefined') {
  function generateMessageUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }).toUpperCase();
  }
}

if (typeof getLocalStorageItem === 'undefined') {
  function getLocalStorageItem(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      try {
        const parsed = JSON.parse(item);
        if (parsed && parsed.expiry && parsed.expiry < Date.now()) {
          localStorage.removeItem(key);
          return null;
        }
        return parsed.value || parsed;
      } catch (e) {
        return item;
      }
    } catch (e) {
      return null;
    }
  }
}

// Send Image Message
async function sendImageMessage() {
  try {
    const phone = $('#imagesendphone').val().trim();
    const imageUrl = $('#imagesendurl').val().trim();
    const caption = $('#imagesendcaption').val().trim();
    
    if (!phone || !imageUrl) {
      showError('Please fill in all required fields');
      return;
    }
    
    const token = getLocalStorageItem('token');
    const myHeaders = new Headers();
    myHeaders.append('token', token);
    myHeaders.append('Content-Type', 'application/json');
    
    const payload = {
      Phone: phone,
      Image: imageUrl,
      Id: generateMessageUUID()
    };
    
    if (caption) {
      payload.Caption = caption;
    }
    
    const res = await fetch(baseUrl + "/chat/send/image", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(payload)
    });
    
    const container = document.getElementById('sendImageContainer');
    if (container) {
      container.classList.remove('hidden');
      const data = await res.json();
      if (res.ok && data.code === 200 && data.success) {
        const messageId = data.data?.Id || data.data?.id || payload.Id;
        container.innerHTML = `<div class="ui success message">Image sent successfully! ID: ${messageId}</div>`;
        $('#modalSendImage').modal('hide');
        setTimeout(() => $('#sendImageForm')[0].reset(), 2000);
      } else {
        const errorMsg = data.error || data.message || `HTTP ${res.status}: ${res.statusText}`;
        container.innerHTML = `<div class="ui error message">Failed to send image: ${errorMsg}</div>`;
      }
    }
  } catch (error) {
    console.error('Error sending image:', error);
    showError('Error sending image: ' + error.message);
  }
}

// Send Audio Message
async function sendAudioMessage() {
  try {
    const phone = $('#audiosendphone').val().trim();
    const audioUrl = $('#audiosendurl').val().trim();
    
    if (!phone || !audioUrl) {
      showError('Please fill in all required fields');
      return;
    }
    
    const token = getLocalStorageItem('token');
    const myHeaders = new Headers();
    myHeaders.append('token', token);
    myHeaders.append('Content-Type', 'application/json');
    
    const payload = {
      Phone: phone,
      Audio: audioUrl,
      Id: generateMessageUUID()
    };
    
    const res = await fetch(baseUrl + "/chat/send/audio", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(payload)
    });
    
    const container = document.getElementById('sendAudioContainer');
    if (container) {
      container.classList.remove('hidden');
      const data = await res.json();
      if (res.ok && data.code === 200 && data.success) {
        const messageId = data.data?.Id || data.data?.id || payload.Id;
        container.innerHTML = `<div class="ui success message">Audio sent successfully! ID: ${messageId}</div>`;
        $('#modalSendAudio').modal('hide');
        setTimeout(() => $('#sendAudioForm')[0].reset(), 2000);
      } else {
        const errorMsg = data.error || data.message || `HTTP ${res.status}: ${res.statusText}`;
        container.innerHTML = `<div class="ui error message">Failed to send audio: ${errorMsg}</div>`;
      }
    }
  } catch (error) {
    console.error('Error sending audio:', error);
    showError('Error sending audio: ' + error.message);
  }
}

// Send Video Message
async function sendVideoMessage() {
  try {
    const phone = $('#videosendphone').val().trim();
    const videoUrl = $('#videosendurl').val().trim();
    const caption = $('#videosendcaption').val().trim();
    
    if (!phone || !videoUrl) {
      showError('Please fill in all required fields');
      return;
    }
    
    const token = getLocalStorageItem('token');
    const myHeaders = new Headers();
    myHeaders.append('token', token);
    myHeaders.append('Content-Type', 'application/json');
    
    const payload = {
      Phone: phone,
      Video: videoUrl,
      Id: generateMessageUUID()
    };
    
    if (caption) {
      payload.Caption = caption;
    }
    
    const res = await fetch(baseUrl + "/chat/send/video", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(payload)
    });
    
    const container = document.getElementById('sendVideoContainer');
    if (container) {
      container.classList.remove('hidden');
      const data = await res.json();
      if (res.ok && data.code === 200 && data.success) {
        const messageId = data.data?.Id || data.data?.id || payload.Id;
        container.innerHTML = `<div class="ui success message">Video sent successfully! ID: ${messageId}</div>`;
        $('#modalSendVideo').modal('hide');
        setTimeout(() => $('#sendVideoForm')[0].reset(), 2000);
      } else {
        const errorMsg = data.error || data.message || `HTTP ${res.status}: ${res.statusText}`;
        container.innerHTML = `<div class="ui error message">Failed to send video: ${errorMsg}</div>`;
      }
    }
  } catch (error) {
    console.error('Error sending video:', error);
    showError('Error sending video: ' + error.message);
  }
}

// Send Document Message
async function sendDocumentMessage() {
  try {
    const phone = $('#documentsendphone').val().trim();
    const documentUrl = $('#documentsendurl').val().trim();
    const fileName = $('#documentsendfilename').val().trim();
    const caption = $('#documentsendcaption').val().trim();
    
    if (!phone || !documentUrl || !fileName) {
      showError('Please fill in all required fields');
      return;
    }
    
    const token = getLocalStorageItem('token');
    const myHeaders = new Headers();
    myHeaders.append('token', token);
    myHeaders.append('Content-Type', 'application/json');
    
    const payload = {
      Phone: phone,
      Document: documentUrl,
      FileName: fileName,
      Id: generateMessageUUID()
    };
    
    if (caption) {
      payload.Caption = caption;
    }
    
    const res = await fetch(baseUrl + "/chat/send/document", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(payload)
    });
    
    const container = document.getElementById('sendDocumentContainer');
    if (container) {
      container.classList.remove('hidden');
      const data = await res.json();
      if (res.ok && data.code === 200 && data.success) {
        const messageId = data.data?.Id || data.data?.id || payload.Id;
        container.innerHTML = `<div class="ui success message">Document sent successfully! ID: ${messageId}</div>`;
        $('#modalSendDocument').modal('hide');
        setTimeout(() => $('#sendDocumentForm')[0].reset(), 2000);
      } else {
        const errorMsg = data.error || data.message || `HTTP ${res.status}: ${res.statusText}`;
        container.innerHTML = `<div class="ui error message">Failed to send document: ${errorMsg}</div>`;
      }
    }
  } catch (error) {
    console.error('Error sending document:', error);
    showError('Error sending document: ' + error.message);
  }
}

// Send Sticker Message
async function sendStickerMessage() {
  try {
    const phone = $('#stickersendphone').val().trim();
    const stickerUrl = $('#stickersendurl').val().trim();
    
    if (!phone || !stickerUrl) {
      showError('Please fill in all required fields');
      return;
    }
    
    const token = getLocalStorageItem('token');
    const myHeaders = new Headers();
    myHeaders.append('token', token);
    myHeaders.append('Content-Type', 'application/json');
    
    const payload = {
      Phone: phone,
      Sticker: stickerUrl,
      Id: generateMessageUUID()
    };
    
    const res = await fetch(baseUrl + "/chat/send/sticker", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(payload)
    });
    
    const container = document.getElementById('sendStickerContainer');
    if (container) {
      container.classList.remove('hidden');
      const data = await res.json();
      if (res.ok && data.code === 200 && data.success) {
        const messageId = data.data?.Id || data.data?.id || payload.Id;
        container.innerHTML = `<div class="ui success message">Sticker sent successfully! ID: ${messageId}</div>`;
        $('#modalSendSticker').modal('hide');
        setTimeout(() => $('#sendStickerForm')[0].reset(), 2000);
      } else {
        const errorMsg = data.error || data.message || `HTTP ${res.status}: ${res.statusText}`;
        container.innerHTML = `<div class="ui error message">Failed to send sticker: ${errorMsg}</div>`;
      }
    }
  } catch (error) {
    console.error('Error sending sticker:', error);
    showError('Error sending sticker: ' + error.message);
  }
}

// Send Location Message
async function sendLocationMessage() {
  try {
    const phone = $('#locationsendphone').val().trim();
    const lat = parseFloat($('#locationsendlat').val());
    const lng = parseFloat($('#locationsendlng').val());
    const name = $('#locationsendname').val().trim();
    const address = $('#locationsendaddress').val().trim();
    
    if (!phone || isNaN(lat) || isNaN(lng)) {
      showError('Please fill in all required fields');
      return;
    }
    
    const token = getLocalStorageItem('token');
    const myHeaders = new Headers();
    myHeaders.append('token', token);
    myHeaders.append('Content-Type', 'application/json');
    
    const payload = {
      Phone: phone,
      Latitude: lat,
      Longitude: lng,
      Id: generateMessageUUID()
    };
    
    if (name) {
      payload.Name = name;
    }
    
    const res = await fetch(baseUrl + "/chat/send/location", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(payload)
    });
    
    const container = document.getElementById('sendLocationContainer');
    if (container) {
      container.classList.remove('hidden');
      const data = await res.json();
      if (res.ok && data.code === 200 && data.success) {
        const messageId = data.data?.Id || data.data?.id || payload.Id;
        container.innerHTML = `<div class="ui success message">Location sent successfully! ID: ${messageId}</div>`;
        $('#modalSendLocation').modal('hide');
        setTimeout(() => $('#sendLocationForm')[0].reset(), 2000);
      } else {
        const errorMsg = data.error || data.message || `HTTP ${res.status}: ${res.statusText}`;
        container.innerHTML = `<div class="ui error message">Failed to send location: ${errorMsg}</div>`;
      }
    }
  } catch (error) {
    console.error('Error sending location:', error);
    showError('Error sending location: ' + error.message);
  }
}

// Send Contact Message
async function sendContactMessage() {
  try {
    const phone = $('#contactsendphone').val().trim();
    const contactPhone = $('#contactsendcontactphone').val().trim();
    const contactName = $('#contactsendname').val().trim();
    
    if (!phone || !contactPhone || !contactName) {
      showError('Please fill in all required fields');
      return;
    }
    
    // Generate vCard
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${contactName}\nTEL;TYPE=CELL:${contactPhone}\nEND:VCARD`;
    
    const token = getLocalStorageItem('token');
    const myHeaders = new Headers();
    myHeaders.append('token', token);
    myHeaders.append('Content-Type', 'application/json');
    
    const payload = {
      Phone: phone,
      Name: contactName,
      Vcard: vcard,
      Id: generateMessageUUID()
    };
    
    const res = await fetch(baseUrl + "/chat/send/contact", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(payload)
    });
    
    const container = document.getElementById('sendContactContainer');
    if (container) {
      container.classList.remove('hidden');
      const data = await res.json();
      if (res.ok && data.code === 200 && data.success) {
        const messageId = data.data?.Id || data.data?.id || payload.Id;
        container.innerHTML = `<div class="ui success message">Contact sent successfully! ID: ${messageId}</div>`;
        $('#modalSendContact').modal('hide');
        setTimeout(() => $('#sendContactForm')[0].reset(), 2000);
      } else {
        const errorMsg = data.error || data.message || `HTTP ${res.status}: ${res.statusText}`;
        container.innerHTML = `<div class="ui error message">Failed to send contact: ${errorMsg}</div>`;
      }
    }
  } catch (error) {
    console.error('Error sending contact:', error);
    showError('Error sending contact: ' + error.message);
  }
}

// Send Poll Message
async function sendPollMessage() {
  try {
    const group = $('#pollsendgroup').val().trim();
    const subject = $('#pollsendsubject').val().trim();
    const options = [];
    
    $('#pollOptionsContainer .poll-option').each(function() {
      const option = $(this).val().trim();
      if (option) {
        options.push(option);
      }
    });
    
    if (!group || !subject || options.length < 2) {
      showError('Please fill in all required fields (minimum 2 options)');
      return;
    }
    
    if (options.length > 12) {
      showError('Maximum of 12 options allowed');
      return;
    }
    
    const token = getLocalStorageItem('token');
    const myHeaders = new Headers();
    myHeaders.append('token', token);
    myHeaders.append('Content-Type', 'application/json');
    
    const payload = {
      group: group,
      header: subject,
      options: options,
      Id: generateMessageUUID()
    };
    
    const res = await fetch(baseUrl + "/chat/send/poll", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(payload)
    });
    
    const container = document.getElementById('sendPollContainer');
    if (container) {
      container.classList.remove('hidden');
      const data = await res.json();
      if (res.ok && data.code === 200 && data.success) {
        const messageId = data.data?.Id || data.data?.id || payload.Id;
        container.innerHTML = `<div class="ui success message">Poll sent successfully! ID: ${messageId}</div>`;
        $('#modalSendPoll').modal('hide');
        setTimeout(() => {
          $('#sendPollForm')[0].reset();
          $('#pollOptionsContainer').html(`
            <div class="two fields">
              <div class="field">
                <input type="text" class="poll-option" placeholder="Option 1" required>
              </div>
              <div class="field">
                <input type="text" class="poll-option" placeholder="Option 2" required>
              </div>
            </div>
          `);
        }, 2000);
      } else {
        const errorMsg = data.error || data.message || `HTTP ${res.status}: ${res.statusText}`;
        container.innerHTML = `<div class="ui error message">Failed to send poll: ${errorMsg}</div>`;
      }
    }
  } catch (error) {
    console.error('Error sending poll:', error);
    showError('Error sending poll: ' + error.message);
  }
}

// React to Message
async function reactToMessage() {
  try {
    const phone = $('#reactphone').val().trim();
    const messageId = $('#reactmessageid').val().trim();
    const emoji = $('#reactemoji').val().trim();
    
    if (!phone || !messageId || !emoji) {
      showError('Please fill in all required fields');
      return;
    }
    
    const token = getLocalStorageItem('token');
    const myHeaders = new Headers();
    myHeaders.append('token', token);
    myHeaders.append('Content-Type', 'application/json');
    
    const payload = {
      Phone: phone,
      Id: messageId,
      Body: emoji
    };
    
    const res = await fetch(baseUrl + "/chat/react", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(payload)
    });
    
    const container = document.getElementById('reactMessageContainer');
    if (container) {
      container.classList.remove('hidden');
      const data = await res.json();
      if (res.ok && data.code === 200 && data.success) {
        container.innerHTML = `<div class="ui success message">Reaction sent successfully!</div>`;
        $('#modalReactMessage').modal('hide');
        setTimeout(() => $('#reactMessageForm')[0].reset(), 2000);
      } else {
        const errorMsg = data.error || data.message || `HTTP ${res.status}: ${res.statusText}`;
        container.innerHTML = `<div class="ui error message">Failed to react: ${errorMsg}</div>`;
      }
    }
  } catch (error) {
    console.error('Error reacting to message:', error);
    showError('Error reacting to message: ' + error.message);
  }
}

// Mark Message as Read
async function markMessageAsRead() {
  try {
    const phone = $('#markreadphone').val().trim();
    const messageId = $('#markreadmessageid').val().trim();
    
    if (!phone || !messageId) {
      showError('Please fill in all required fields');
      return;
    }
    
    const token = getLocalStorageItem('token');
    const myHeaders = new Headers();
    myHeaders.append('token', token);
    myHeaders.append('Content-Type', 'application/json');
    
    const payload = {
      ChatPhone: phone,
      Id: [messageId]
    };
    
    const res = await fetch(baseUrl + "/chat/markread", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(payload)
    });
    
    const container = document.getElementById('markReadContainer');
    if (container) {
      container.classList.remove('hidden');
      const data = await res.json();
      if (res.ok && data.code === 200 && data.success) {
        container.innerHTML = `<div class="ui success message">Message marked as read successfully!</div>`;
        $('#modalMarkRead').modal('hide');
        setTimeout(() => $('#markReadForm')[0].reset(), 2000);
      } else {
        const errorMsg = data.error || data.message || `HTTP ${res.status}: ${res.statusText}`;
        container.innerHTML = `<div class="ui error message">Failed to mark as read: ${errorMsg}</div>`;
      }
    }
  } catch (error) {
    console.error('Error marking as read:', error);
    showError('Error marking as read: ' + error.message);
  }
}

// Edit Message
async function editMessage() {
  try {
    const phone = $('#editphone').val().trim();
    const messageId = $('#editmessageid').val().trim();
    const newText = $('#editnewtext').val().trim();
    
    if (!phone || !messageId || !newText) {
      showError('Please fill in all required fields');
      return;
    }
    
    const token = getLocalStorageItem('token');
    const myHeaders = new Headers();
    myHeaders.append('token', token);
    myHeaders.append('Content-Type', 'application/json');
    
    const payload = {
      Phone: phone,
      Id: messageId,
      Body: newText
    };
    
    const res = await fetch(baseUrl + "/chat/send/edit", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(payload)
    });
    
    const container = document.getElementById('editMessageContainer');
    if (container) {
      container.classList.remove('hidden');
      const data = await res.json();
      if (res.ok && data.code === 200 && data.success) {
        container.innerHTML = `<div class="ui success message">Message edited successfully!</div>`;
        $('#modalEditMessage').modal('hide');
        setTimeout(() => $('#editMessageForm')[0].reset(), 2000);
      } else {
        const errorMsg = data.error || data.message || `HTTP ${res.status}: ${res.statusText}`;
        container.innerHTML = `<div class="ui error message">Failed to edit message: ${errorMsg}</div>`;
      }
    }
  } catch (error) {
    console.error('Error editing message:', error);
    showError('Error editing message: ' + error.message);
  }
}

// Set Chat Presence
async function setChatPresence() {
  try {
    const phone = $('#chatpresencephone').val().trim();
    // Get value from dropdown (Fomantic-UI dropdown)
    let presenceType = '';
    try {
      presenceType = $('#chatpresencetype').dropdown('get value');
    } catch (e) {
      // Dropdown not initialized, use regular val()
      presenceType = $('#chatpresencetype').val();
    }
    // Fallback if still empty
    if (!presenceType) {
      presenceType = $('#chatpresencetype').val();
    }
    
    if (!phone || !presenceType) {
      showError('Please fill in all required fields');
      return;
    }
    
    const token = getLocalStorageItem('token');
    const myHeaders = new Headers();
    myHeaders.append('token', token);
    myHeaders.append('Content-Type', 'application/json');
    
    const payload = {
      Phone: phone,
      State: presenceType
    };
    
    const res = await fetch(baseUrl + "/chat/presence", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(payload)
    });
    
    const container = document.getElementById('chatPresenceContainer');
    if (container) {
      container.classList.remove('hidden');
      const data = await res.json();
      if (res.ok && data.code === 200 && data.success) {
        container.innerHTML = `<div class="ui success message">Chat presence set successfully!</div>`;
        $('#modalChatPresence').modal('hide');
        setTimeout(() => $('#chatPresenceForm')[0].reset(), 2000);
      } else {
        const errorMsg = data.error || data.message || `HTTP ${res.status}: ${res.statusText}`;
        container.innerHTML = `<div class="ui error message">Failed to set presence: ${errorMsg}</div>`;
      }
    }
  } catch (error) {
    console.error('Error setting chat presence:', error);
    showError('Error setting chat presence: ' + error.message);
  }
}

// Archive Chat
async function archiveChat() {
  try {
    const phone = $('#archivechatphone').val().trim();
    const archive = $('#archivechatarchive').is(':checked');
    
    if (!phone) {
      showError('Please fill in phone number');
      return;
    }
    
    const token = getLocalStorageItem('token');
    const myHeaders = new Headers();
    myHeaders.append('token', token);
    myHeaders.append('Content-Type', 'application/json');
    
    const payload = {
      jid: phone.includes('@') ? phone : phone + '@s.whatsapp.net',
      archive: archive
    };
    
    const res = await fetch(baseUrl + "/chat/archive", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(payload)
    });
    
    const container = document.getElementById('archiveChatContainer');
    if (container) {
      container.classList.remove('hidden');
      const data = await res.json();
      if (res.ok && data.code === 200 && data.success) {
        container.innerHTML = `<div class="ui success message">Chat ${archive ? 'archived' : 'unarchived'} successfully!</div>`;
        $('#modalArchiveChat').modal('hide');
        setTimeout(() => $('#archiveChatForm')[0].reset(), 2000);
      } else {
        const errorMsg = data.error || data.message || `HTTP ${res.status}: ${res.statusText}`;
        container.innerHTML = `<div class="ui error message">Failed to ${archive ? 'archive' : 'unarchive'} chat: ${errorMsg}</div>`;
      }
    }
  } catch (error) {
    console.error('Error archiving chat:', error);
    showError('Error archiving chat: ' + error.message);
  }
}

// Set Status Message
async function setStatusMessage() {
  try {
    const statusText = $('#setstatustext').val().trim();
    
    if (!statusText) {
      showError('Please fill in status text');
      return;
    }
    
    const token = getLocalStorageItem('token');
    const myHeaders = new Headers();
    myHeaders.append('token', token);
    myHeaders.append('Content-Type', 'application/json');
    
    const payload = {
      Body: statusText
    };
    
    const res = await fetch(baseUrl + "/status/set/text", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(payload)
    });
    
    const container = document.getElementById('setStatusContainer');
    if (container) {
      container.classList.remove('hidden');
      const data = await res.json();
      if (res.ok && data.code === 200 && data.success) {
        container.innerHTML = `<div class="ui success message">Status set successfully!</div>`;
        $('#modalSetStatus').modal('hide');
        setTimeout(() => $('#setStatusForm')[0].reset(), 2000);
      } else {
        const errorMsg = data.error || data.message || `HTTP ${res.status}: ${res.statusText}`;
        container.innerHTML = `<div class="ui error message">Failed to set status: ${errorMsg}</div>`;
      }
    }
  } catch (error) {
    console.error('Error setting status:', error);
    showError('Error setting status: ' + error.message);
  }
}

// Reject Call
async function rejectCall() {
  try {
    const callId = $('#rejectcallid').val().trim();
    
    if (!callId) {
      showError('Please fill in call ID');
      return;
    }
    
    // Extract call_from from call_id if needed
    // Format: call_id usually contains the caller info
    const callFrom = callId.split('_')[0] || '';
    
    const token = getLocalStorageItem('token');
    const myHeaders = new Headers();
    myHeaders.append('token', token);
    myHeaders.append('Content-Type', 'application/json');
    
    const payload = {
      call_id: callId,
      call_from: callFrom || 'unknown'
    };
    
    const res = await fetch(baseUrl + "/call/reject", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(payload)
    });
    
    const container = document.getElementById('rejectCallContainer');
    if (container) {
      container.classList.remove('hidden');
      const data = await res.json();
      if (res.ok && data.code === 200 && data.success) {
        container.innerHTML = `<div class="ui success message">Call rejected successfully!</div>`;
        $('#modalRejectCall').modal('hide');
        setTimeout(() => $('#rejectCallForm')[0].reset(), 2000);
      } else {
        const errorMsg = data.error || data.message || `HTTP ${res.status}: ${res.statusText}`;
        container.innerHTML = `<div class="ui error message">Failed to reject call: ${errorMsg}</div>`;
      }
    }
  } catch (error) {
    console.error('Error rejecting call:', error);
    showError('Error rejecting call: ' + error.message);
  }
}
