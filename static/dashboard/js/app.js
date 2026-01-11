let baseUrl = window.location.origin;
let scanned = false;
let updateAdminTimeout = null;
let updateUserTimeout = null;
let updateInterval = 5000;
let instanceToDelete = null;
let isAdminLogin = false;
let currentInstanceData = null;
let scanInterval = null;

document.addEventListener('DOMContentLoaded', function() {

  let isHandlingChange = false;

  const loginForm = document.getElementById('loginForm');
  const loginTokenInput = document.getElementById('loginToken');
  const regularLoginBtn = document.getElementById('regularLoginBtn');
  const adminLoginBtn = document.getElementById('loginAsAdminBtn');
 
  hideWidgets();

  $('#deleteInstanceModal').modal({
    closable: true,
    onDeny: function() {
      instanceToDelete = null;
    }
  });

  // Initialize dropdowns for webhook events
  $('#webhookEvents').dropdown({
    onChange: function(value, text, $selectedItem) {
      if (isHandlingChange) return;
      if (value.includes('All')) {
        // If "All" is selected, clear selection and select only "All"
        isHandlingChange = true;
        $('#webhookEvents').dropdown('clear');
        $('#webhookEvents').dropdown('set selected', 'All');
        isHandlingChange = false;
      }
    }
  });

  $('#webhookEventsInstance').dropdown({
    onChange: function(value, text, $selectedItem) {
      if (isHandlingChange) return;
      if (value.includes('All')) {
        // If "All" is selected, clear selection and select only "All"
        isHandlingChange = true;
        $('#webhookEventsInstance').dropdown('clear');
        $('#webhookEventsInstance').dropdown('set selected', 'All');
        isHandlingChange = false;
      }
    }
  });

  // Initialize S3 media delivery dropdown
  $('#s3MediaDelivery').dropdown();
  $('#addInstanceS3MediaDelivery').dropdown();

  // Initialize proxy enabled checkbox with onChange handler
  $('#proxyEnabledToggle').checkbox({
    onChange: function() {
      const enabled = $('#proxyEnabled').is(':checked');
      if (enabled) {
        $('#proxyUrlField').addClass('show');
      } else {
        $('#proxyUrlField').removeClass('show');
      }
    }
  });

  // Initialize add instance proxy toggle
  $('#addInstanceProxyToggle').checkbox({
    onChange: function() {
      const enabled = $('input[name="proxy_enabled"]').is(':checked');
      if (enabled) {
        $('#addInstanceProxyUrlField').show();
      } else {
        $('#addInstanceProxyUrlField').hide();
        $('input[name="proxy_url"]').val('');
      }
    }
  });

  // Initialize add instance S3 toggle
  $('#addInstanceS3Toggle').checkbox({
    onChange: function() {
      const enabled = $('input[name="s3_enabled"]').is(':checked');
      if (enabled) {
        $('#addInstanceS3Fields').show();
      } else {
        $('#addInstanceS3Fields').hide();
        // Clear S3 fields when disabled
        $('input[name="s3_endpoint"]').val('');
        $('input[name="s3_access_key"]').val('');
        $('input[name="s3_secret_key"]').val('');
        $('input[name="s3_bucket"]').val('');
        $('input[name="s3_region"]').val('');
        $('input[name="s3_public_url"]').val('');
        $('input[name="s3_retention_days"]').val('30');
        $('input[name="s3_path_style"]').prop('checked', false);
        $('#addInstanceS3MediaDelivery').dropdown('set selected', 'base64');
      }
    }
  });

  // Initialize add instance HMAC toggle
  $('#addInstanceHmacToggle').checkbox({
    onChange: function() {
      const enabled = $('input[name="hmac_enabled"]').is(':checked');
      if (enabled) {
        $('#addInstanceHmacKeyWarningMessage').show();
        $('#addInstanceHmacKeyField').show();
      } else {
        $('#addInstanceHmacKeyWarningMessage').hide();
        $('#addInstanceHmacKeyField').hide();
        // Clear HMAC field when disabled
        $('input[name="hmac_key"]').val('');
      }
    }
  });

  // Handle admin login button click
  adminLoginBtn.addEventListener('click', function() {
    isAdminLogin = true;
    loginForm.classList.add('loading');
    
    // Change button appearance to show admin mode
    adminLoginBtn.classList.add('teal');
    adminLoginBtn.innerHTML = '<i class="shield alternate icon"></i> Admin Mode';
    $('#loginToken').val('').focus();
    
    // Show admin-specific instructions
    $('.ui.info.message').html(`
        <div class="header mb-4">
            <i class="user shield icon"></i>
            Admin Login
        </div>
        <p>Please enter your admin credentials:</p>
        <ul>
            <li>Use your admin token in the field above</li>
        </ul>
    `);
    
    // Focus on token input
    loginTokenInput.focus();
    loginForm.classList.remove('loading');
  });

  // Handle form submission
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const token = loginTokenInput.value.trim();
    
    if (!token) {
        showError('Please enter your access token');
        $('#loginToken').focus();
        return;
    }
    
    loginForm.classList.add('loading');
     
    setTimeout(() => {
        if (isAdminLogin) {
            handleAdminLogin(token,true);
        } else {
            handleRegularLogin(token,true);
        }
        
        loginForm.classList.remove('loading');
    }, 1000);
  });

  $('#menulogout').on('click',function(e) {
    $('.adminlogin').hide();
    e.preventDefault();
    removeLocalStorageItem('isAdmin');
    removeLocalStorageItem('admintoken');
    removeLocalStorageItem('token');
    removeLocalStorageItem('currentInstance');
    currentInstanceData = null; // Clear instance data
    window.location.reload();
    return false;
  });

  const pairPhoneInput = document.getElementById('pairphoneinput');
  if (pairPhoneInput) {
    pairPhoneInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const phone = pairPhoneInput.value.trim();
        if (phone) {
          connect().then((data) => {
            if(data.success==true) {
              pairPhone(phone)
                .then((data) => {
                  const pairHelp = document.getElementById('pairHelp');
                  if (pairHelp) {
                    pairHelp.classList.add('hidden');
                  }
                  // Success case
                  if (data.success && data.data && data.data.LinkingCode) {
                    const pairInfo = document.getElementById('pairInfo');
                    if (pairInfo) {
                      pairInfo.innerHTML = `Your link code is: ${data.data.LinkingCode}`;
                    }
                    // Clear any existing interval
                    if (scanInterval) {
                      clearInterval(scanInterval);
                    }
                    // Start checking status
                    scanInterval = setInterval(function() {
                      status().then((result) => {
                        if (result.success && result.data && result.data.loggedIn) {
                          if (scanInterval) {
                            clearInterval(scanInterval);
                            scanInterval = null;
                          }
                          scanned = true;
                          // Reload page or update UI
                          window.location.reload();
                        }
                      });
                    }, 1000);
                  } else {
                    const pairInfo = document.getElementById('pairInfo');
                    if (pairInfo) {
                      pairInfo.innerHTML = "Problem getting pairing code";
                    }
                  }
                })
                .catch((error) => {
                  // Error case
                  const pairInfo = document.getElementById('pairInfo');
                  if (pairInfo) {
                    pairInfo.innerHTML = "Problem getting pairing code";
                  }
                  console.error('Pairing error:', error);
                });
            }
          });
        }
      }
    });
  }

  const userInfoInput = document.getElementById('userinfoinput');
  if (userInfoInput) {
    userInfoInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        doUserInfo();
      }
    });
  }
 
  const userAvatarInput = document.getElementById('useravatarinput');
  if (userAvatarInput) {
    userAvatarInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        doUserAvatar();
      }
    });
  }

  const userInfoCard = document.getElementById('userInfo');
  if (userInfoCard) {
    userInfoCard.addEventListener('click', function() {
      const container = document.getElementById('userInfoContainer');
      if (container) {
        container.innerHTML='';
        container.classList.add('hidden');
      }
      $('#modalUserInfo').modal({onApprove: function() {
        doUserInfo();
        return false;
      }}).modal('show');
    });
  }

  const userAvatarCard = document.getElementById('userAvatar');
  if (userAvatarCard) {
    userAvatarCard.addEventListener('click', function() {
      const container = document.getElementById('userAvatarContainer');
      if (container) {
        container.innerHTML='';
        container.classList.add('hidden');
      }
      $('#modalUserAvatar').modal({onApprove: function() {
        doUserAvatar();
        return false;
      }}).modal('show');
    });
  }

  const sendTextMessageCard = document.getElementById('sendTextMessage');
  if (sendTextMessageCard) {
    sendTextMessageCard.addEventListener('click', function() {
      const container = document.getElementById('sendMessageContainer');
      if (container) {
        container.innerHTML='';
        container.classList.add('hidden');
      }
      $('#modalSendTextMessage').modal({onApprove: function() {
        sendTextMessage().then((result)=>{
          if (container) {
            container.classList.remove('hidden');
            if(result.success===true) {
               container.innerHTML=`Message sent successfully. Id: ${result.data.Id}`
            } else {
               container.innerHTML=`Problem sending message: ${result.error}`
            }
          }
        });
        return false;
      }}).modal('show');
    });
  }
 
  const deleteMessageCard = document.getElementById('deleteMessage');
  if (deleteMessageCard) {
    deleteMessageCard.addEventListener('click', function() {
      const container = document.getElementById('deleteMessageContainer');
      if (container) {
        container.innerHTML='';
        container.classList.add('hidden');
      }
      $('#modalDeleteMessage').modal({onApprove: function() {
        deleteMessage().then((result)=>{
          console.log(result);
          if (container) {
            container.classList.remove('hidden');
            if(result.success===true) {
               container.innerHTML=`Message deleted successfully.`
            } else {
               container.innerHTML=`Problem deleting message: ${result.error}`
            }
          }
        });
        return false;
      }}).modal('show');
    });
  }
  
  const userContactsCard = document.getElementById('userContacts');
  if (userContactsCard) {
    userContactsCard.addEventListener('click', function() {
      getContacts();
    });
  }

  // Send Buttons Message - using event delegation to handle dynamically shown cards
  $(document).on('click', '#sendButtonsMessage', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Send Buttons Message card clicked');
    
    const container = document.getElementById('sendButtonsContainer');
    if (container) {
      container.innerHTML='';
      container.classList.add('hidden');
    }
    // Reset form and initialize
    const buttonsForm = document.getElementById('sendButtonsForm');
    if (buttonsForm) {
      buttonsForm.reset();
    }
    $('#buttonsContainer').html(`
      <div class="button-field">
        <div class="field">
          <label>Button Type <span class="required">*</span></label>
          <select class="ui dropdown button-type" required>
            <option value="id">ID (Response Button)</option>
            <option value="phoneNumber">Phone Number</option>
            <option value="url">URL</option>
          </select>
          <small>Type of button action</small>
        </div>
        <div class="field button-id-field">
          <label>Button ID</label>
          <input type="text" class="button-id" placeholder="unique-id-1" maxlength="256">
          <small>Unique identifier for response button</small>
        </div>
        <div class="field button-phone-field" style="display: none;">
          <label>Phone Number <span class="required">*</span></label>
          <input type="text" class="button-phone" placeholder="5521989848442" maxlength="20">
          <small>Phone number to call (with country code, no +)</small>
        </div>
        <div class="field button-url-field" style="display: none;">
          <label>URL <span class="required">*</span></label>
          <input type="url" class="button-url" placeholder="https://example.com" maxlength="500">
          <small>URL to open when button is clicked</small>
        </div>
        <div class="field">
          <label>Button Text <span class="required">*</span></label>
          <input type="text" class="button-text" placeholder="Button Label" maxlength="20" required>
          <small>Text displayed on button (max 20 chars)</small>
        </div>
      </div>
    `);
    // Initialize dropdown and handlers
    $('#buttonsContainer .ui.dropdown').dropdown();
    $('#buttonsContainer .button-type').on('change', function() {
      const type = $(this).val();
      const field = $(this).closest('.button-field');
      field.find('.button-id-field').toggle(type === 'id');
      field.find('.button-phone-field').toggle(type === 'phoneNumber');
      field.find('.button-url-field').toggle(type === 'url');
    });
    updateButtonControls();
    
    // Initialize modal if not already initialized
    if (!$('#modalSendButtonsMessage').hasClass('ui modal')) {
      $('#modalSendButtonsMessage').modal({
        onApprove: function() {
          sendButtonsMessage();
          return false;
        }
      });
    }
    $('#modalSendButtonsMessage').modal('show');
  });

  // Send List Message - using event delegation to handle dynamically shown cards
  $(document).on('click', '#sendListMessage', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Send List Message card clicked');
    
    const container = document.getElementById('sendListContainer');
    if (container) {
      container.innerHTML='';
      container.classList.add('hidden');
    }
    // Reset form and initialize
    const listForm = document.getElementById('sendListForm');
    if (listForm) {
      listForm.reset();
    }
    resetListForm();
    updateSectionControls();
    
    // Initialize modal if not already initialized
    if (!$('#modalSendListMessage').hasClass('ui modal')) {
      $('#modalSendListMessage').modal({
        onApprove: function() {
          sendListMessage();
          return false;
        }
      });
    }
    $('#modalSendListMessage').modal('show');
  });

  // Add/Remove Buttons
  const addButtonBtn = document.getElementById('addButtonBtn');
  if (addButtonBtn) {
    addButtonBtn.addEventListener('click', function() {
      addButtonField();
    });
  }

  const removeButtonBtn = document.getElementById('removeButtonBtn');
  if (removeButtonBtn) {
    removeButtonBtn.addEventListener('click', function() {
      removeButtonField();
    });
  }

  // Send Buttons Submit
  const sendButtonsSubmit = document.getElementById('sendButtonsSubmit');
  if (sendButtonsSubmit) {
    sendButtonsSubmit.addEventListener('click', function() {
      sendButtonsMessage();
    });
  }

  // Send List Submit
  const sendListSubmit = document.getElementById('sendListSubmit');
  if (sendListSubmit) {
    sendListSubmit.addEventListener('click', function() {
      sendListMessage();
    });
  }

  // List Section Controls - using event delegation since sections are added dynamically
  $(document).on('click', '#addSectionBtn', function() {
    addListSection();
  });

  $(document).on('click', '#removeSectionBtn', function() {
    removeListSection();
  });

  // List item controls using event delegation
  $(document).on('click', '.add-list-item-btn', function() {
    const section = $(this).closest('.list-section');
    addListItem(section);
  });

  $(document).on('click', '.remove-list-item-btn', function() {
    const section = $(this).closest('.list-section');
    removeListItem(section);
  });

  // S3 Configuration
  const s3ConfigCard = document.getElementById('s3Config');
  if (s3ConfigCard) {
    s3ConfigCard.addEventListener('click', function() {
      $('#modalS3Config').modal({
        onApprove: function() {
          saveS3Config();
          return false;
        }
      }).modal('show');
      loadS3Config();
    });
  }

  // History Configuration
  const historyConfigCard = document.getElementById('historyConfig');
  if (historyConfigCard) {
    historyConfigCard.addEventListener('click', function() {
      $('#modalHistoryConfig').modal({
        onApprove: function() {
          saveHistoryConfig();
          return false;
        }
      }).modal('show');
      loadHistoryConfig();
    });
  }

  // Proxy Configuration
  const proxyConfigCard = document.getElementById('proxyConfig');
  if (proxyConfigCard) {
    proxyConfigCard.addEventListener('click', function() {
      $('#modalProxyConfig').modal({
        onApprove: function() {
          saveProxyConfig();
          return false;
        }
      }).modal('show');
      loadProxyConfig();
    });
  }

  // Webhook Configuration
  const webhookConfigCard = document.getElementById('webhookConfig');
  if (webhookConfigCard) {
    webhookConfigCard.addEventListener('click', function() {
      webhookModal();
    });
  }

  // S3 Test Connection
  const testS3ConnectionBtn = document.getElementById('testS3Connection');
  if (testS3ConnectionBtn) {
    testS3ConnectionBtn.addEventListener('click', function() {
      testS3Connection();
    });
  }

  // S3 Delete Configuration
  const deleteS3ConfigBtn = document.getElementById('deleteS3Config');
  if (deleteS3ConfigBtn) {
    deleteS3ConfigBtn.addEventListener('click', function() {
      deleteS3Config();
    });
  }

  // HMAC Configuration
  const hmacConfigCard = document.getElementById('hmacConfig');
  if (hmacConfigCard) {
    hmacConfigCard.addEventListener('click', function() {
      $('#modalHmacConfig').modal({
        onApprove: function() {
          saveHmacConfig();
          return false;
        }
      }).modal('show');
      loadHmacConfig();
    });
  }

  // HMAC Generate Key
  const generateHmacKeyBtn = document.getElementById('generateHmacKey');
  if (generateHmacKeyBtn) {
    generateHmacKeyBtn.addEventListener('click', function() {
      generateRandomHmacKey();
    });
  }

  // HMAC Show/Hide Key
  const showHmacKeyBtn = document.getElementById('showHmacKey');
  if (showHmacKeyBtn) {
    showHmacKeyBtn.addEventListener('click', function() {
      toggleHmacKeyVisibility();
    });
  }

  const hideHmacKeyBtn = document.getElementById('hideHmacKey');
  if (hideHmacKeyBtn) {
    hideHmacKeyBtn.addEventListener('click', function() {
      toggleHmacKeyVisibility();
    });
  }

  // HMAC Delete Configuration
  const deleteHmacConfigBtn = document.getElementById('deleteHmacConfig');
  if (deleteHmacConfigBtn) {
    deleteHmacConfigBtn.addEventListener('click', function() {
      deleteHmacConfig();
    });
  }

  // HMAC Instance Generate Key
  const generateHmacKeyInstanceBtn = document.getElementById('generateHmacKeyInstance');
  if (generateHmacKeyInstanceBtn) {
    generateHmacKeyInstanceBtn.addEventListener('click', function() {
      generateRandomHmacKeyInstance();
    });
  }

  // HMAC Instance Show/Hide Key
  const showHmacKeyInstanceBtn = document.getElementById('showHmacKeyInstance');
  if (showHmacKeyInstanceBtn) {
    showHmacKeyInstanceBtn.addEventListener('click', function() {
      toggleHmacKeyVisibilityInstance();
    });
  }

  const hideHmacKeyInstanceBtn = document.getElementById('hideHmacKeyInstance');
  if (hideHmacKeyInstanceBtn) {
    hideHmacKeyInstanceBtn.addEventListener('click', function() {
      toggleHmacKeyVisibilityInstance();
    });
  }

  // Proxy checkbox toggle is now initialized in DOMContentLoaded

  $('#addInstanceButton').click(function() {
    $('#addInstanceModal').modal({
      onApprove: function(e,pp) {
         $('#addInstanceForm').submit();
         return false;
      }
    }).modal('show');
  });
  
  $('#addInstanceForm').form({
    fields: {
      name: {
        identifier: 'name',
        rules: [{
          type: 'empty',
          prompt: 'Please enter a name for the instance'
        }]
      },
      token: {
        identifier: 'token',
        rules: [{
          type: 'empty',
          prompt: 'Please enter an authentication token for the instance'
        }]
      },
      events: {
        identifier: 'events',
        rules: [{
          type: 'empty',
          prompt: 'Please select at least one event'
        }]
      },
      history: {
        identifier: 'history',
        optional: true,
        rules: [{
          type: 'integer[0..]',
          prompt: 'History must be a non-negative integer'
        }]
      },
      proxy_url: {
        identifier: 'proxy_url',
        optional: true,
        rules: [{
          type: 'regExp[^(https?|socks5)://.*]',
          prompt: 'Proxy URL must start with http://, https://, or socks5://'
        }]
      },
      s3_endpoint: {
        identifier: 's3_endpoint',
        optional: true,
        rules: [{
          type: 'url',
          prompt: 'Please enter a valid S3 endpoint URL'
        }]
      },
      s3_bucket: {
        identifier: 's3_bucket',
        optional: true,
        rules: [{
          type: 'regExp[^[a-z0-9][a-z0-9.-]*[a-z0-9]$]',
          prompt: 'Please enter a valid S3 bucket name'
        }]
      }
    },
    onSuccess: function(event, fields) {
      event.preventDefault();

      // Validate conditional fields
      const proxyEnabled = fields.proxy_enabled === 'on' || fields.proxy_enabled === true;
      const s3Enabled = fields.s3_enabled === 'on' || fields.s3_enabled === true;
      const hmacEnabled = fields.hmac_enabled === 'on' || fields.hmac_enabled === true;

      if (proxyEnabled && !fields.proxy_url) {
        showError('Proxy URL is required when proxy is enabled');
        return false;
      }

      if (s3Enabled) {
        if (!fields.s3_bucket) {
          showError('S3 bucket name is required when S3 is enabled');
          return false;
        }
        if (!fields.s3_access_key) {
          showError('S3 access key is required when S3 is enabled');
          return false;
        }
        if (!fields.s3_secret_key) {
          showError('S3 secret key is required when S3 is enabled');
          return false;
        }
      }

      if (hmacEnabled && !fields.hmac_key) {
        showError('HMAC key is required when HMAC is enabled');
        return false;
      }

      if (hmacEnabled && fields.hmac_key && fields.hmac_key.length < 32) {
        showError('HMAC key must be at least 32 characters long');
        return false;
      }

      addInstance(fields).then((result) => {
        if (result.success) {
          showSuccess('Instance created successfully');
          // Refresh the instances list
          updateAdmin();
        } else {
          showError('Failed to create instance: ' + (result.error || 'Unknown error'));
        }
      }).catch((error) => {
        showError('Error creating instance: ' + error.message);
      });

      $('#addInstanceModal').modal('hide');
      $('#addInstanceForm').form('reset');
      $('.ui.dropdown').dropdown('restore defaults');
      // Reset toggles
      $('#addInstanceProxyToggle').checkbox('set unchecked');
      $('#addInstanceS3Toggle').checkbox('set unchecked');
      $('#addInstanceHmacToggle').checkbox('set unchecked');
      $('#addInstanceProxyUrlField').hide();
      $('#addInstanceS3Fields').hide();
      $('#addInstanceHmacKeyWarningMessage').hide();
      $('#addInstanceHmacKeyField').hide();
    }
  });

  init();
});

async function addInstance(data) {
  console.log("Add Instance...");
  const admintoken = getLocalStorageItem('admintoken');
  const myHeaders = new Headers();
  myHeaders.append('authorization', admintoken);
  myHeaders.append('Content-Type', 'application/json');

  // Build proxy configuration
  const proxyEnabled = data.proxy_enabled === 'on' || data.proxy_enabled === true;
  const proxyConfig = {
    enabled: proxyEnabled,
    proxyURL: proxyEnabled ? (data.proxy_url || '') : ''
  };
  
  // Build S3 configuration
  const s3Enabled = data.s3_enabled === 'on' || data.s3_enabled === true;
  const s3PathStyle = data.s3_path_style === 'on' || data.s3_path_style === true;
  const s3Config = {
    enabled: s3Enabled,
    endpoint: s3Enabled ? (data.s3_endpoint || '') : '',
    region: s3Enabled ? (data.s3_region || '') : '',
    bucket: s3Enabled ? (data.s3_bucket || '') : '',
    accessKey: s3Enabled ? (data.s3_access_key || '') : '',
    secretKey: s3Enabled ? (data.s3_secret_key || '') : '',
    pathStyle: s3PathStyle,
    publicURL: s3Enabled ? (data.s3_public_url || '') : '',
    mediaDelivery: s3Enabled ? (data.s3_media_delivery || 'base64') : 'base64',
    retentionDays: s3Enabled ? (parseInt(data.s3_retention_days) || 30) : 30
  };

  // Build HMAC configuration
  const hmacEnabled = data.hmac_enabled === 'on' || data.hmac_enabled === true;
  const hmacKey = hmacEnabled ? (data.hmac_key || '') : '';

  const payload = {
    name: data.name,
    token: data.token,
    events: data.events.join(','),
    webhook: data.webhook_url || '',
    expiration: 0,
    history: parseInt(data.history) || 0,
    proxyConfig: proxyConfig,
    s3Config: s3Config,
    hmacKey: hmacKey
  };

  console.log("Payload being sent:", payload);

  res = await fetch(baseUrl + "/admin/users", {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify(payload)
  });

  const responseData = await res.json();
  console.log("Response:", responseData);
  return responseData;
}

function webhookModal() {
  getWebhook().then((response)=>{
    if(response.success==true) {
      $('#webhookEvents').val(response.data.subscribe);
      $('#webhookEvents').dropdown('set selected', response.data.subscribe);
      $('#webhookinput').val(response.data.webhook);
      $('#modalSetWebhook').modal({onApprove: function() {
        setWebhook().then((result)=>{
          if(result.success===true) {
             $.toast({ class: 'success', message: `Webhook set successfully !`});
          } else {
             $.toast({ class: 'error', message: `Problem setting webhook: ${result.error}`});
          }
        });
        return true;
      }}).modal('show');
    }
  });
}

function modalPairPhone() {
  $('#modalLoginWithCode').modal({
     onVisible: function() {
       document.getElementById('pairInfo').classList.remove('hidden');;
       document.getElementById('pairHelp').classList.remove('hidden');;
     },
     onHidden: function() {
       if(scanned==true) {
           document.getElementById('loginQR').classList.add('hidden');
           document.getElementById('loginCode').classList.add('hidden');
           document.getElementById('logoutWidget').classList.remove('hidden');
       }
     }
   })
   .modal('show');
}

function handleRegularLogin(token,notifications=false) {
  console.log('Regular login with token:', token);
  setLocalStorageItem('token', token, 6);
  removeLocalStorageItem('isAdmin');
  $('.adminlogin').hide();
  statusRequest().then((status) => {
    if(status.success==true) {
      console.log(status.data);
      setLocalStorageItem('currentInstance', status.data.id, 6);
      // Save current user JID for groups functionality
      if(status.data.jid) {
        setLocalStorageItem('currentUserJID', status.data.jid, 6);
        window.currentUserJID = status.data.jid;
      }
      populateInstances([status.data]);
      showRegularUser();
      $('.logingrid').addClass('hidden');
      $('.admingrid').addClass('hidden');
      $('.maingrid').removeClass('hidden');
      $('.adminlogin').hide();
      showWidgets();
      $('#'+status.data.instanceId).removeClass('hidden');
      updateUser();
    } else {
      removeLocalStorageItem('token');
      showError("Invalid credentials");
      $('#loginToken').focus();
    }
  });
}
  
function updateUser() {
  // retrieves one instance status at regular interval
  status().then((result)=> {
    if(result.success==true) {
      // Save current user JID for groups functionality
      if(result.data.jid) {
        setLocalStorageItem('currentUserJID', result.data.jid, 6);
        window.currentUserJID = result.data.jid;
      }
      populateInstances([result.data]);
    } 
  });
  clearTimeout(updateUserTimeout)
  updateUserTimeout = setTimeout(function() { updateUser() }, updateInterval);
}

function updateAdmin() {
  // retrieves all instances status at regular intervals
  const current = getLocalStorageItem("currentInstance")
  if(!current) {
    // get all instances status
    getUsers().then((result) => {
      if(result.success==true) {
        populateInstances(result.data)
      } 
    });
  } else {
    // get only active instance status
    status().then((result)=> {
      if(result.success==true) {
        populateInstances([result.data]);
      } 
    });
  }
  clearTimeout(updateAdminTimeout)
  updateAdminTimeout = setTimeout(function() { updateAdmin() }, updateInterval);
}

function handleAdminLogin(token,notifications=false) {
  console.log('Admin login with token:', token);
  setLocalStorageItem('admintoken', token, 6);
  setLocalStorageItem('isAdmin', true, 6);
  $('.adminlogin').show();
  const currentInstance = getLocalStorageItem("currentInstance");

  getUsers().then((result) => {
    if(result.success==true) {

      showAdminUser();

      if(currentInstance == null) {
        $('.admingrid').removeClass('hidden');
        populateInstances(result.data);
      } else {
        populateInstances(result.data);
        $('.maingrid').removeClass('hidden');
        showWidgets();
        const showInstanceId=`instance-card-${currentInstance}`
        $('#'+showInstanceId).removeClass('hidden');
      }
      $('#loading').removeClass('active');
      $('.logingrid').addClass('hidden');
      updateAdmin();
    } else {
      removeLocalStorageItem('admintoken');
      removeLocalStorageItem('token');
      removeLocalStorageItem('isAdmin');
      showError("Admin login failed");
      $('#loginToken').focus();
    }
  });
}
    
function showError(message) {
  $('body').toast({
    class: 'error',
    message: message,
    showIcon: 'exclamation circle',
    position: 'top center',
    showProgress: 'bottom'
  });
}
    
function showSuccess(message) {
  $('body').toast({
    class: 'success',
    message: message,
    showIcon: 'check circle',
    position: 'top center',
    showProgress: 'bottom'
  });
}

function deleteInstance(id) {
  instanceToDelete = id;
  $('#deleteInstanceModal').modal({
    onApprove: function() {
      performDelete(instanceToDelete);
    }
  }).modal('show');
}

async function performDelete(id) {
  console.log('Deleting instance with ID:', id);
  const admintoken = getLocalStorageItem('admintoken');
  const myHeaders = new Headers();
  myHeaders.append('authorization', admintoken);
  myHeaders.append('Content-Type', 'application/json');
  res = await fetch(baseUrl + "/admin/users/"+id+"/full", {
    method: "DELETE",
    headers: myHeaders
  });
  data = await res.json();
  if(data.success===true) {
    $('#instance-row-' + id).remove();
    showDeleteSuccess();
  } else {
    showError('Error deleting instance');
  }
}

function showDeleteSuccess() {
  $('body').toast({
    class: 'success',
    message: 'Instance deleted successfully',
    position: 'top right',
    showProgress: 'bottom'
  });
}

function openDashboard(id,token) {
  setLocalStorageItem('currentInstance', id, 6);
  setLocalStorageItem('token', token, 6);
  $(`#instance-card-${id}`).removeClass('hidden');
  console.log($(`#instance-card-${id}`));
  showWidgets();
  $('.admingrid').addClass('hidden');
  $('.maingrid').removeClass('hidden');
  $('.card.no-hover').addClass('hidden');
  $(`#instance-card-${id}`).removeClass('hidden');
  $('.adminlogin').show();
}

function goBackToList() {
  $('#instances-cards > div').addClass('hidden');
  removeLocalStorageItem('currentInstance');
  currentInstanceData = null; // Clear instance data
  updateAdmin();
  removeLocalStorageItem('token');
  hideWidgets();
  $('.maingrid').addClass('hidden');
  $('.admingrid').removeClass('hidden');
  $('.adminlogin').hide();
}

async function sendTextMessage() {
  const token = getLocalStorageItem('token');
  const sendPhone = document.getElementById('messagesendphone').value.trim();
  const sendBody = document.getElementById('messagesendtext').value;
  const myHeaders = new Headers();
  const uuid = generateMessageUUID();
  myHeaders.append('token', token);
  myHeaders.append('Content-Type', 'application/json');
  res = await fetch(baseUrl + "/chat/send/text", {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({Phone: sendPhone, Body: sendBody, Id: uuid})
  });
  data = await res.json();
  return data;
}
 
async function deleteMessage() {
  const deletePhone = document.getElementById('messagedeletephone').value.trim();
  const deleteId = document.getElementById('messagedeleteid').value;
  const token = getLocalStorageItem('token');
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  myHeaders.append('Content-Type', 'application/json');
  res = await fetch(baseUrl + "/chat/delete", {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({Phone: deletePhone, Id: deleteId})
  });
  data = await res.json();
  return data;
}
 
async function setWebhook() {
  const token = getLocalStorageItem('token');
  const webhook = document.getElementById('webhookinput').value.trim();
  const events = $('#webhookEvents').dropdown('get value')
  if (events.includes("All")) {
    events.length = 0;
    events.push("All");
  }
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  myHeaders.append('Content-Type', 'application/json');
  res = await fetch(baseUrl + "/webhook", {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({webhookurl: webhook, events: events})
  });
  data = await res.json();
  return data;
}
 
function doUserAvatar() {
  const userAvatarInput = document.getElementById('useravatarinput');
  let phone = userAvatarInput.value.trim();
  if (phone) {
    if (!phone.endsWith('@s.whatsapp.net')) {
      phone = phone.includes('@') ? phone.split('@')[0] + '@s.whatsapp.net' : phone + '@s.whatsapp.net';
    }
    userAvatar(phone).then((data) => {
      document.getElementById("userAvatarContainer").classList.remove('hidden');
      if (data.success && data.data && data.data.url) {
        const userAvatarDiv = document.getElementById('userAvatarContainer');
        userAvatarDiv.innerHTML=`<img src="${data.data.url}" alt="Profile Picture" class="user-avatar">`;
      } else {
          document.getElementById('userAvatarContainer').innerHTML = 'No user avatar found';
      }
    }).catch(error => {
      document.getElementById('userAvatarContainer').innerHTML = 'Error fetching user avatar';
      console.error('Error:', error);
    });
  }
} 

function doUserInfo() {
  const userInfoInput = document.getElementById('userinfoinput');
  let phone = userInfoInput.value.trim();
  if (phone) {
    if (!phone.endsWith('@s.whatsapp.net')) {
      phone = phone.includes('@') ? phone.split('@')[0] + '@s.whatsapp.net' : phone + '@s.whatsapp.net';
    }
    userInfo(phone).then((data) => {
      document.getElementById("userInfoContainer").classList.remove('hidden');
      if (data.success && data.data && data.data.Users) {
          const userInfoDiv = document.getElementById('userInfoContainer');
          userInfoDiv.innerHTML = '';
          
          for (const [userJid, userData] of Object.entries(data.data.Users)) {
              const userElement = document.createElement('div');
              userElement.className = 'user-entry';
              
              const phoneNumber = userJid.split('@')[0];
              userElement.innerHTML += `<strong>Phone: ${phoneNumber}</strong><br>`;
              userElement.innerHTML += `Status: ${userData.Status || 'Not available'}<br>`;
              userElement.innerHTML += `Verified Name: ${userData.VerifiedName || 'Not verified'}<br>`;
              if (userData.Devices && userData.Devices.length > 0) {
                  userElement.innerHTML += `Devices: ${userData.Devices.length}<br>`;
              }
              userInfoDiv.appendChild(userElement);
          }
      } else {
          document.getElementById('userInfoContainer').innerHTML = 'No user data found';
      }
    }).catch(error => {
      document.getElementById('userInfoContainer').innerHTML = 'Error fetching user info';
      console.error('Error:', error);
    });
  }
}

function showWidgets() {
  document.querySelectorAll('.widget').forEach(widget => {
    widget.classList.remove('hidden');
  });
}

function hideWidgets() {
  document.querySelectorAll('.widget').forEach(widget => {
    widget.classList.add('hidden');
  });
}

async function connect(token='') {
  console.log("Connecting...");
  if(token=='') {
     token = getLocalStorageItem('token');
  }
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  myHeaders.append('Content-Type', 'application/json');
  res = await fetch(baseUrl + "/session/connect", {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({Subscribe: ['All'], Immediate: true})
  });
  data = await res.json();
  updateInterval=1000; // Decrease interval to react quicker to QR scan
  return data;
}

async function disconnect(token) {
  console.log("Disconnecting...");
  if(token=='') {
     token = getLocalStorageItem('token');
  }
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  myHeaders.append('Content-Type', 'application/json');
  res = await fetch(baseUrl + "/session/disconnect", {
    method: "POST",
    headers: myHeaders,
  });
  data = await res.json();
  return data;
}

async function status() {
  console.log("Get status...");
  const token = getLocalStorageItem('token');
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  myHeaders.append('Content-Type', 'application/json');
  res = await fetch(baseUrl + "/session/status", {
    method: "GET",
    headers: myHeaders
  });
  data = await res.json();
  if(data.data.loggedIn==true) updateInterval=5000;
  return data;
}

async function getUsers() {
  console.log("Get users...");
  const admintoken = getLocalStorageItem('admintoken');
  const myHeaders = new Headers();
  myHeaders.append('authorization', admintoken);
  myHeaders.append('Content-Type', 'application/json');
  res = await fetch(baseUrl + "/admin/users", {
    method: "GET",
    headers: myHeaders
  });
  data = await res.json();
  return data;
}

async function getWebhook(token='') {
  console.log("Getting webhook...");
  if(token=='') {
    token = getLocalStorageItem('token');
  }
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  myHeaders.append('Content-Type', 'application/json');
  try {
    const res = await fetch(baseUrl + "/webhook", {
      method: "GET",
      headers: myHeaders,
    });
    data = await res.json();
    return data;
  } catch (error) {
    return '{}';
    throw error;
  }
}

async function getContacts() {
  console.log("Getting contacts...");
  const token = getLocalStorageItem('token');
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  myHeaders.append('Content-Type', 'application/json');
  try {
    const res = await fetch(baseUrl + "/user/contacts", {
      method: "GET",
      headers: myHeaders,
    });
    data = await res.json();
    if (data.code === 200) {
      const transformedContacts = Object.entries(data.data).map(([phone, contact]) => ({
          FullName: contact.FullName || "",
          PushName: contact.PushName || "",
          Phone: phone.split('@')[0] // Remove the @s.whatsapp.net part
      }));
      downloadJson(transformedContacts, 'contacts.json');
      return transformedContacts;
    } else {
      throw new Error(`API returned code ${data.code}`);
    }
  } catch (error) {
    console.error("Error fetching contacts:", error);
    throw error;
  }
}

async function userAvatar(phone) {
  console.log("Requesting user avatar...");
  const token = getLocalStorageItem('token');
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  myHeaders.append('Content-Type', 'application/json');
  res = await fetch(baseUrl + "/user/avatar", {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({Phone: phone, Preview: false})
  });
  data = await res.json();
  return data;
}

async function userInfo(phone) {
  console.log("Requesting user info...");
  const token = getLocalStorageItem('token');
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  myHeaders.append('Content-Type', 'application/json');
  res = await fetch(baseUrl + "/user/info", {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({Phone: [phone]})
  });
  data = await res.json();
  return data;
}

async function pairPhone(phone) {
  console.log("Requesting pairing code...");
  const token = getLocalStorageItem('token');
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  myHeaders.append('Content-Type', 'application/json');
  res = await fetch(baseUrl + "/session/pairphone", {
    method: "POST",
    headers: myHeaders,
    body: JSON.stringify({Phone: phone})
  });
  data = await res.json();
  return data;
}

async function logout(token='') {
  console.log("Login out...");
  if(token=='') {
    token = getLocalStorageItem('token');
  }
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  myHeaders.append('Content-Type', 'application/json');
  res = await fetch(baseUrl + "/session/logout", {
    method: "POST",
    headers: myHeaders,
  });
  data = await res.json();
  return data;
}

async function getQr() {
  const myHeaders = new Headers();
  const token = getLocalStorageItem('token');
  myHeaders.append('token', token);
  res = await fetch(baseUrl + "/session/qr", {
    method: "GET",
    headers: myHeaders,
  });
  data = await res.json();
  return data;
}

async function statusRequest() {
  const myHeaders = new Headers();
  const token = getLocalStorageItem('token');
  const isAdminLogin = getLocalStorageItem('isAdmin');
  if(token!=null && isAdminLogin==null) {
    myHeaders.append('token', token);
    res = await fetch(baseUrl + "/session/status", {
      method: "GET",
      headers: myHeaders,
    });
    data = await res.json();
    return data;
  }
}

function parseURLParams(url) {
  var queryStart = url.indexOf("?") + 1,
      queryEnd   = url.indexOf("#") + 1 || url.length + 1,
      query = url.slice(queryStart, queryEnd - 1),
      pairs = query.replace(/\+/g, " ").split("&"),
      parms = {}, i, n, v, nv;

  if (query === url || query === "") return;
    for (i = 0; i < pairs.length; i++) {
      nv = pairs[i].split("=", 2);
      n = decodeURIComponent(nv[0]);
      v = decodeURIComponent(nv[1]);
      if (!parms.hasOwnProperty(n)) parms[n] = [];
      parms[n].push(nv.length === 2 ? v : null);
  }
  return parms;
}

function downloadJson(data, filename) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  }, 100);
}

function generateMessageUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function init() { 

  // Starting
  let notoken=0;
  let token = getLocalStorageItem('token');
  let admintoken = getLocalStorageItem('admintoken');
  let isAdminLogin = getLocalStorageItem('isAdmin');
  $('.adminlogin').hide();

  if(token == null && admintoken == null) {
    $('.logingrid').removeClass('hidden');
    $('.maingrid').addClass('hidden');
  } else {
    if (isAdminLogin) {
      handleAdminLogin(admintoken);
    } else {
      handleRegularLogin(token);
    }
  }
}

function populateInstances(instances) {
  const tableBody = $('#instances-body');
  const cardsContainer = $('#instances-cards'); // Assuming you have a container for cards
  tableBody.empty();
  cardsContainer.empty();
  const currentInstance = getLocalStorageItem('currentInstance');

  if(instances.length==0) {
    const nodatarow = '<tr><td style="text-align:center;" colspan=5>No instances found</td></tr>'
    tableBody.append(nodatarow);
  }
  instances.forEach(instance => {

  const row = `
      <tr>
        <td>${instance.id}</td>
        <td>${instance.name}</td>
        <td><i class="${instance.connected ? 'check green' : 'times red'} icon"></i> <span class="status ${instance.connected}">${instance.connected ? 'Yes' : 'No'}</span></td>
        <td><i class="${instance.loggedIn ? 'check green' : 'times red'} icon"></i> <span class="status ${instance.loggedIn}">${instance.loggedIn ? 'Yes' : 'No'}</span></td>
        <td>
          <button class="ui primary button dashboard-button" onclick="openDashboard('${instance.id}', '${instance.token}')">
            <i class="external alternate icon"></i> Open
          </button>
          <button class="ui negative button dashboard-button" onclick="deleteInstance('${instance.id}')">
            <i class="trash alternate icon"></i> Delete
          </button>
        </td>
      </tr>
  `;
  tableBody.append(row);

  const card = `
      <div class="ui fluid card hidden no-hover" id="instance-card-${instance.id}">
          <div class="content">
              <div class="ui ${instance.loggedIn ? 'one' : 'two'} column stackable grid">
                  <!-- Left Column - Instance Info -->
                  <div class="column">
                      <div class="header" style="font-size: 1.3em; margin-bottom: 0.5rem;">
                          ${instance.name}
                          <div class="ui labels" style="margin-top: 0.5em;">
                              <div class="ui ${instance.connected ? 'green' : 'red'} horizontal label">
                                  <i class="${instance.connected ? 'check' : 'times'} icon"></i>
                                  ${instance.connected ? 'Connected' : 'Disconnected'}
                              </div>
                              <div class="ui ${instance.loggedIn ? 'green' : 'red'} horizontal label">
                                  <i class="${instance.loggedIn ? 'check' : 'times'} icon"></i>
                                  ${instance.loggedIn ? 'Logged In' : 'Logged Out'}
                              </div>
                          </div>
                      </div>
                      
                      <div class="meta" style="margin-bottom: 1rem;">Instance ID: ${instance.id}</div>
                      
                      <div class="ui list">
                          <div class="item">
                              <div class="header">Token</div>
                              <div class="content" style="word-break: break-all;">${instance.token}</div>
                          </div>
                          <div class="item">
                              <div class="header">JID</div>
                              <div class="content">${instance.jid || 'Not available'}</div>
                          </div>
                          <div class="item">
                              <div class="header">Webhook</div>
                              <div class="content" style="word-break: break-all;">${instance.webhook || 'Not configured'}</div>
                          </div>
                          <div class="item">
                              <div class="header">HMAC</div>
                              <div class="content">${instance.hmac_configured ? 'Configured' : 'Not configured'}</div>
                          </div>
                          <div class="item">
                              <div class="header">Subscribed Events</div>
                              <div class="content">${instance.events || 'Not configured'}</div>
                          </div>
                          <div class="item">
                              <div class="header">Message History</div>
                              <div class="content">${instance.history || 0} messages per chat</div>
                          </div>
                          <div class="item">
                              <div class="header">Proxy</div>
                              <div class="content">${instance.proxy_config.enabled ? 'Enabled' : 'Disabled'}</div>
                          </div>
                          <div class="item">
                              <div class="header">Proxy URL</div>
                              <div class="content">${instance.proxy_config.proxy_url || 'Not configured'}</div>
                          </div>
                          <div class="item">
                              <div class="header">S3</div>
                              <div class="content">${instance.s3_config.enabled ? 'Enabled' : 'Disabled'}</div>
                          </div>
                          <div class="item">
                              <div class="header">S3 Endpoint</div>
                              <div class="content">${instance.s3_config.endpoint || 'Not configured'}</div>
                          </div>
                      </div>
                  </div>
                  
                  <!-- Right Column - QR Code (only shown if not logged in) -->
                  ${!instance.loggedIn ? `
                  <div class="column" style="display: flex; flex-direction: column; justify-content: center; align-items: center;">
                      <div class="ui segment" style="width: 100%; max-width: 200px; height: 200px; display: flex; justify-content: center; align-items: center;">
                        ${instance.qrcode ? 
                          `<img src="${instance.qrcode}" style="max-height: 100%; max-width: 100%;">
                      </div>
                      <div>
                        Open WhatsApp on your phone and tap<br/><i class="ellipsis vertical icon"></i>> Linked devices > Link a device.
                          ` : 
                                `<div class="ui icon header" style="text-align: center;">
                                    <i class="qrcode icon" style="font-size: 3em;"></i>
                                    <div class="sub header">QR Code will appear here</div>
                                </div>`
                           }
                      </div>
                    </div>
                    ` : `
                    <!--one column when no qr to display-->
                    `}
                </div>
            </div>
            
            <div class="extra content">
              <button class="ui primary positive button dashboard-button ${instance.connected === true ? 'hidden' : ''}" id="button-connect-${instance.id}" onclick="connect('${instance.token}')">Connect</button>
              <button class="ui primary negative button dashboard-button ${instance.connected === true ? '' : 'hidden'}" id="button-logout-${instance.id}" onclick="logout('${instance.token}')">Logout</button>
              <button class="ui primary positive button dashboard-button ${instance.connected === true && instance.loggedIn === false ? '' : 'hidden'} id="button-logout-${instance.id}" onclick="modalPairPhone()">Login with Pairing Code</button>
              </div>
        </div>
        `;
    cardsContainer.append(card);
  });
  if(currentInstance!==null) {
     const showInstanceId=`instance-card-${currentInstance}`
     $('#'+showInstanceId).removeClass('hidden');
     
     // Store current instance data globally for use in modals
     const currentInstanceObj = instances.find(inst => inst.id === currentInstance);
     if (currentInstanceObj) {
       currentInstanceData = currentInstanceObj;
     }
  } 
}

/**
 * Set an item in localStorage with expiry time (in hours)
 * @param {string} key - Key to store under
 * @param {*} value - Value to store
 * @param {number} hours - Expiry time in hours (default: 1 hour)
 */
function setLocalStorageItem(key, value, hours = 1) {
  const now = new Date();
  const expiryTime = now.getTime() + hours * 60 * 60 * 1000; // Convert hours to milliseconds

  const item = {
    value: value,
    expiry: expiryTime,
  };

  localStorage.setItem(key, JSON.stringify(item));
}

/**
 * Get an item from localStorage. Returns null if expired or not found.
 * @param {string} key - Key to retrieve
 * @returns {*|null} - Stored value or null
 */
function getLocalStorageItem(key) {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  try {
    const item = JSON.parse(itemStr);
    const now = new Date().getTime();

    // Check if expired (only if the parsed item has an expiry property)
    if (item.expiry && now > item.expiry) {
      localStorage.removeItem(key); // Clean up expired item
      return null;
    }

    // Return value only if the parsed item has a value property
    return item.value !== undefined ? item.value : null;
  } catch (e) {
    // If JSON parsing fails, treat it as not found
    return null;
  }
}

/**
 * Remove an item from localStorage
 * @param {string} key - Key to remove
 */
function removeLocalStorageItem(key) {
  localStorage.removeItem(key);
}

/**
 * Clear all localStorage items (with or without expiry)
 */
function clearLocalStorage() {
  localStorage.clear();
}

function showAdminUser() {
  const indicator = document.getElementById('user-role-indicator');
  const text = document.getElementById('user-role-text');
  
  indicator.className = 'item admin';
  indicator.innerHTML = `
    <i class="user shield icon"></i>
    <div class="ui mini label">ADMIN</div>
  `;
}
  
function showRegularUser() {
  const indicator = document.getElementById('user-role-indicator');
  const text = document.getElementById('user-role-text');
  
  indicator.className = 'item user';
  indicator.innerHTML = `
    <i class="user icon"></i>
    <div class="ui mini label">USER</div>
  `;
}

// S3 Configuration Functions
async function loadS3Config() {
  // Check if we have instance data available (admin viewing specific instance)
  if (currentInstanceData && currentInstanceData.s3_config) {
    const s3Config = currentInstanceData.s3_config;
    const hasConfig = s3Config.enabled || s3Config.endpoint || s3Config.bucket;
    
    $('#s3Endpoint').val(s3Config.endpoint || '');
    $('#s3AccessKey').val(s3Config.access_key === '***' ? '' : s3Config.access_key || '');
    $('#s3SecretKey').val(''); // Never show secret key
    $('#s3Bucket').val(s3Config.bucket || '');
    $('#s3Region').val(s3Config.region || '');
    $('#s3ForcePathStyle').prop('checked', s3Config.path_style || false);
    $('#s3PublicUrl').val(s3Config.public_url || '');
    
    // Media delivery dropdown
    $('#s3MediaDelivery').dropdown('set selected', s3Config.media_delivery || 'base64');
    
    // Retention days
    $('#s3RetentionDays').val(s3Config.retention_days || 30);
    
    // Show/hide delete button based on whether config exists
    if (hasConfig) {
      $('#deleteS3Config').show();
    } else {
      $('#deleteS3Config').hide();
    }
    
    return;
  }
  
  // Fallback to API call for regular users or when instance data is not available
  const token = getLocalStorageItem('token');
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  
  try {
    const res = await fetch(baseUrl + "/session/s3/config", {
      method: "GET",
      headers: myHeaders
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.code === 200 && data.data) {
        const hasConfig = data.data.enabled || data.data.endpoint || data.data.bucket;
        
        $('#s3Endpoint').val(data.data.endpoint || '');
        $('#s3AccessKey').val(data.data.access_key === '***' ? '' : data.data.access_key);
        $('#s3SecretKey').val(''); // Never show secret key
        $('#s3Bucket').val(data.data.bucket || '');
        $('#s3Region').val(data.data.region || '');
        $('#s3ForcePathStyle').prop('checked', data.data.path_style || false);
        $('#s3PublicUrl').val(data.data.public_url || '');
        
        // Media delivery dropdown
        $('#s3MediaDelivery').dropdown('set selected', data.data.media_delivery || 'base64');
        
        // Retention days
        $('#s3RetentionDays').val(data.data.retention_days || 30);
        
        // Show/hide delete button based on whether config exists
        if (hasConfig) {
          $('#deleteS3Config').show();
        } else {
          $('#deleteS3Config').hide();
        }
      } else {
        // No config found, hide delete button and set defaults
        $('#deleteS3Config').hide();
        $('#s3Endpoint').val('');
        $('#s3AccessKey').val('');
        $('#s3SecretKey').val('');
        $('#s3Bucket').val('');
        $('#s3Region').val('');
        $('#s3ForcePathStyle').prop('checked', false);
        $('#s3PublicUrl').val('');
        $('#s3MediaDelivery').dropdown('set selected', 'base64');
        $('#s3RetentionDays').val(30);
      }
    }
  } catch (error) {
    console.error('Error loading S3 config:', error);
    $('#deleteS3Config').hide();
  }
}

async function saveS3Config() {
  const token = getLocalStorageItem('token');
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  myHeaders.append('Content-Type', 'application/json');
  
  const config = {
    enabled: true,
    endpoint: $('#s3Endpoint').val().trim(),
    access_key: $('#s3AccessKey').val().trim(),
    secret_key: $('#s3SecretKey').val().trim(),
    bucket: $('#s3Bucket').val().trim(),
    region: $('#s3Region').val().trim(),
    path_style: $('#s3ForcePathStyle').is(':checked'),
    public_url: $('#s3PublicUrl').val().trim(),
    media_delivery: $('#s3MediaDelivery').val() || 'base64',
    retention_days: parseInt($('#s3RetentionDays').val()) || 30
  };
  
  try {
    const res = await fetch(baseUrl + "/session/s3/config", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(config)
    });
    
    const data = await res.json();
    if (data.success) {
      showSuccess('S3 configuration saved successfully');
      // Show delete button since we now have a configuration
      $('#deleteS3Config').show();
      $('#modalS3Config').modal('hide');
    } else {
      showError('Failed to save S3 configuration: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    showError('Error saving S3 configuration');
    console.error('Error:', error);
  }
}

async function testS3Connection() {
  const token = getLocalStorageItem('token');
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  
  // Show loading state
  $('#testS3Connection').addClass('loading disabled');
  
  try {
    const res = await fetch(baseUrl + "/session/s3/test", {
      method: "POST",
      headers: myHeaders
    });
    
    const data = await res.json();
    if (data.success) {
      showSuccess('S3 connection test successful!');
    } else {
      showError('S3 connection test failed: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    showError('Error testing S3 connection');
    console.error('Error:', error);
  } finally {
    $('#testS3Connection').removeClass('loading disabled');
  }
}

async function deleteS3Config() {
  // Show confirmation dialog
  if (!confirm('Are you sure you want to delete the S3 configuration? This action cannot be undone.')) {
    return;
  }
  
  const token = getLocalStorageItem('token');
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  
  // Show loading state
  $('#deleteS3Config').addClass('loading disabled');
  
  try {
    const res = await fetch(baseUrl + "/session/s3/config", {
      method: "DELETE",
      headers: myHeaders
    });
    
    const data = await res.json();
    if (data.success) {
      showSuccess('S3 configuration deleted successfully');
      
      // Clear all form fields
      $('#s3Endpoint').val('');
      $('#s3AccessKey').val('');
      $('#s3SecretKey').val('');
      $('#s3Bucket').val('');
      $('#s3Region').val('');
      $('#s3ForcePathStyle').prop('checked', false);
      $('#s3PublicUrl').val('');
      $('#s3MediaDelivery').dropdown('set selected', 'base64');
      $('#s3RetentionDays').val(30);
      
      // Hide delete button
      $('#deleteS3Config').hide();
      
      $('#modalS3Config').modal('hide');
    } else {
      showError('Failed to delete S3 configuration: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    showError('Error deleting S3 configuration');
    console.error('Error:', error);
  } finally {
    $('#deleteS3Config').removeClass('loading disabled');
  }
}

// History Configuration Functions
async function loadHistoryConfig() {
  const token = getLocalStorageItem('token');
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  
  try {
    // Get user status to check proxy_config
    const res = await fetch(baseUrl + "/session/status", {
      method: "GET",
      headers: myHeaders
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.code === 200 && data.data && data.data.history) {
        const historyConfig = data.data.history;
        $('#history').val(historyConfig);
        
      } else {
        $('#history').val('0');
      }
    }
  } catch (error) {
    console.error('Error loading history config:', error);
  }
}

async function saveHistoryConfig() {
  const token = getLocalStorageItem('token');
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  myHeaders.append('Content-Type', 'application/json');
  
  const historyConfig = parseInt($('#history').val());
  
  const config = {
    history: historyConfig,
  };
  
  try {
    const res = await fetch(baseUrl + "/session/history", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(config)
    });
    
    const data = await res.json();
    if (data.success) {
      showSuccess('History configuration saved successfully');
      $('#modalHistoryConfig').modal('hide');
    } else {
      showError('Failed to save history configuration: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    showError('Error saving history configuration');
    console.error('Error:', error);
  }
}

// Proxy Configuration Functions
async function loadProxyConfig() {
  const token = getLocalStorageItem('token');
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  
  try {
    // Get user status to check proxy_config
    const res = await fetch(baseUrl + "/session/status", {
      method: "GET",
      headers: myHeaders
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.code === 200 && data.data && data.data.proxy_config) {
        const proxyConfig = data.data.proxy_config;
        const proxyUrl = proxyConfig.proxy_url || '';
        const enabled = proxyConfig.enabled || false;
        
        // Set checkbox state
        $('#proxyEnabled').prop('checked', enabled);
        $('#proxyEnabledToggle').checkbox(enabled ? 'set checked' : 'set unchecked');
        
        // Set proxy URL
        $('#proxyUrl').val(proxyUrl);
        
        // Show/hide URL field based on enabled state
        if (enabled) {
          $('#proxyUrlField').addClass('show');
        } else {
          $('#proxyUrlField').removeClass('show');
        }
      } else {
        // No proxy config, set defaults
        $('#proxyEnabled').prop('checked', false);
        $('#proxyEnabledToggle').checkbox('set unchecked');
        $('#proxyUrl').val('');
        $('#proxyUrlField').removeClass('show');
      }
    }
  } catch (error) {
    console.error('Error loading proxy config:', error);
  }
}

async function saveProxyConfig() {
  const token = getLocalStorageItem('token');
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  myHeaders.append('Content-Type', 'application/json');
  
  const enabled = $('#proxyEnabled').is(':checked');
  const proxyUrl = $('#proxyUrl').val().trim();
  
  // If proxy is disabled, send disable request
  if (!enabled) {
    const config = {
      enable: false,
      proxy_url: ''
    };
    
    try {
      const res = await fetch(baseUrl + "/session/proxy", {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(config)
      });
      
      const data = await res.json();
      if (data.success) {
        showSuccess('Proxy disabled successfully');
        $('#modalProxyConfig').modal('hide');
      } else {
        showError('Failed to disable proxy: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      showError('Error disabling proxy');
      console.error('Error:', error);
    }
    return;
  }
  
  // If enabled, validate proxy URL
  if (!proxyUrl) {
    showError('Proxy URL is required when proxy is enabled');
    return;
  }
  
  // Validate proxy URL has correct protocol
  if (!proxyUrl.startsWith('http://') && !proxyUrl.startsWith('https://') && !proxyUrl.startsWith('socks5://')) {
    showError('Proxy URL must start with http://, https://, or socks5://');
    return;
  }
  
  const config = {
    enable: true,
    proxy_url: proxyUrl
  };
  
  try {
    const res = await fetch(baseUrl + "/session/proxy", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(config)
    });
    
    const data = await res.json();
    if (data.success) {
      showSuccess('Proxy configuration saved successfully');
      $('#modalProxyConfig').modal('hide');
    } else {
      showError('Failed to save proxy configuration: ' + (data.error || 'Unknown error'));
    }
  } catch (error) {
    showError('Error saving proxy configuration');
    console.error('Error:', error);
  }
}

// HMAC Configuration Functions
async function loadHmacConfig() {
  const token = getLocalStorageItem('token');
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  
  try {
    const res = await fetch(baseUrl + "/session/hmac/config", {
      method: "GET",
      headers: myHeaders
    });
    
    if (res.ok) {
      const hmacConfig = await res.json();
      
      $('#hmacKey').val(hmacConfig.hmac_key === '***' ? '' : hmacConfig.hmac_key);
      
      if (hmacConfig.hmac_key === '***') {
        $('#deleteHmacConfig').show();
      } else {
        $('#deleteHmacConfig').hide();
      }
    } else {
      // No config found or error
      $('#deleteHmacConfig').hide();
      $('#hmacKey').val('');
    }
  } catch (error) {
    console.error('Error loading HMAC config:', error);
    $('#deleteHmacConfig').hide();
    $('#hmacKey').val('');
  }
}

async function saveHmacConfig() {
  const token = getLocalStorageItem('token');
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  myHeaders.append('Content-Type', 'application/json');
  
  const hmacKey = $('#hmacKey').val().trim();
  
  if (!hmacKey) {
    showError('HMAC key is required');
    return;
  }
  
  if (hmacKey.length < 32) {
    showError('HMAC key must be at least 32 characters long');
    return;
  }
  
  const config = {
    hmac_key: hmacKey
  };
  
  try {
    const res = await fetch(baseUrl + "/session/hmac/config", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(config)
    });
    
    const response = await res.json();
    
    if (res.ok && response.Details) {
      showSuccess('HMAC configuration saved successfully');
      $('#deleteHmacConfig').show();
      $('#modalHmacConfig').modal('hide');
    } else {
      showError('Failed to save HMAC configuration: ' + (response.error || 'Unknown error'));
    }
  } catch (error) {
    showError('Error saving HMAC configuration');
    console.error('Error:', error);
  }
}

async function deleteHmacConfig() {
  // Show confirmation dialog
  if (!confirm('Are you sure you want to delete the HMAC configuration? This action cannot be undone.')) {
    return;
  }
  
  const token = getLocalStorageItem('token');
  const myHeaders = new Headers();
  myHeaders.append('token', token);
  
  // Show loading state
  $('#deleteHmacConfig').addClass('loading disabled');
  
  try {
    const res = await fetch(baseUrl + "/session/hmac/config", {
      method: "DELETE",
      headers: myHeaders
    });
    
    const response = await res.json();
    
    // Nova verificação - estrutura direta sem "success"
    if (res.ok && response.Details) {
      showSuccess('HMAC configuration deleted successfully');
      
      // Clear form field
      $('#hmacKey').val('');
      
      // Hide delete button
      $('#deleteHmacConfig').hide();
      
      $('#modalHmacConfig').modal('hide');
    } else {
      showError('Failed to delete HMAC configuration: ' + (response.error || 'Unknown error'));
    }
  } catch (error) {
    showError('Error deleting HMAC configuration');
    console.error('Error:', error);
  } finally {
    $('#deleteHmacConfig').removeClass('loading disabled');
  }
}

function generateRandomHmacKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  $('#hmacKey').val(result);
}

function toggleHmacKeyVisibility() {
  const input = $('#hmacKey');
  const showBtn = $('#showHmacKey');
  const hideBtn = $('#hideHmacKey');
  
  if (input.attr('type') === 'password') {
    input.attr('type', 'text');
    showBtn.hide();
    hideBtn.show();
  } else {
    input.attr('type', 'password');
    showBtn.show();
    hideBtn.hide();
  }
}

// HMAC Instance Functions
function generateRandomHmacKeyInstance() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  $('input[name="hmac_key"]').val(result);
}

function toggleHmacKeyVisibilityInstance() {
  const input = $('input[name="hmac_key"]');
  const showBtn = $('#showHmacKeyInstance');
  const hideBtn = $('#hideHmacKeyInstance');
  
  if (input.attr('type') === 'password') {
    input.attr('type', 'text');
    showBtn.hide();
    hideBtn.show();
  } else {
    input.attr('type', 'password');
    showBtn.show();
    hideBtn.hide();
  }
}

// Buttons Message Functions
function addButtonField() {
  const container = $('#buttonsContainer');
  const buttonFields = container.find('.button-field');
  
  if (buttonFields.length >= 5) {
    showError('Maximum of 5 buttons allowed');
    return;
  }
  
  const newField = $(`
    <div class="button-field">
      <div class="field">
        <label>Button Type <span class="required">*</span></label>
        <select class="ui dropdown button-type" required>
          <option value="id">ID (Response Button)</option>
          <option value="phoneNumber">Phone Number</option>
          <option value="url">URL</option>
        </select>
        <small>Type of button action</small>
      </div>
      <div class="field button-id-field">
        <label>Button ID</label>
        <input type="text" class="button-id" placeholder="unique-id-${buttonFields.length + 1}" maxlength="256">
        <small>Unique identifier for response button</small>
      </div>
      <div class="field button-phone-field" style="display: none;">
        <label>Phone Number <span class="required">*</span></label>
        <input type="text" class="button-phone" placeholder="5521989848442" maxlength="20">
        <small>Phone number to call (with country code, no +)</small>
      </div>
      <div class="field button-url-field" style="display: none;">
        <label>URL <span class="required">*</span></label>
        <input type="url" class="button-url" placeholder="https://example.com" maxlength="500">
        <small>URL to open when button is clicked</small>
      </div>
      <div class="field">
        <label>Button Text <span class="required">*</span></label>
        <input type="text" class="button-text" placeholder="Button Label" maxlength="20" required>
        <small>Text displayed on button (max 20 chars)</small>
      </div>
    </div>
  `);
  
  container.append(newField);
  
  // Initialize dropdown
  newField.find('.ui.dropdown').dropdown();
  
  // Handle type change
  newField.find('.button-type').on('change', function() {
    const type = $(this).val();
    const field = $(this).closest('.button-field');
    field.find('.button-id-field').toggle(type === 'id');
    field.find('.button-phone-field').toggle(type === 'phoneNumber');
    field.find('.button-url-field').toggle(type === 'url');
  });
  
  updateButtonControls();
}

function removeButtonField() {
  const container = $('#buttonsContainer');
  const buttonFields = container.find('.button-field');
  
  if (buttonFields.length > 1) {
    buttonFields.last().remove();
  }
  
  updateButtonControls();
}

function updateButtonControls() {
  const container = $('#buttonsContainer');
  const buttonFields = container.find('.button-field');
  const addBtn = $('#addButtonBtn');
  const removeBtn = $('#removeButtonBtn');
  
  if (buttonFields.length >= 5) {
    addBtn.prop('disabled', true);
  } else {
    addBtn.prop('disabled', false);
  }
  
  if (buttonFields.length > 1) {
    removeBtn.show();
  } else {
    removeBtn.hide();
  }
}

async function sendButtonsMessage() {
  try {
    const phone = $('#buttonssendphone').val().trim();
    const title = $('#buttonssendtitle').val().trim();
    const footer = $('#buttonssendfooter').val().trim();
    
    if (!phone || !title) {
      showError('Please fill in all required fields');
      return;
    }
    
    // Collect buttons
    const buttons = [];
    const buttonFields = $('#buttonsContainer .button-field');
    
    if (buttonFields.length === 0) {
      showError('Please add at least one button');
      return;
    }
    
    let hasError = false;
    buttonFields.each(function() {
      if (hasError) return false;
      
      const buttonType = $(this).find('.button-type').val() || 'id';
      const buttonId = $(this).find('.button-id').val().trim();
      const buttonPhone = $(this).find('.button-phone').val().trim();
      const buttonUrl = $(this).find('.button-url').val().trim();
      const buttonText = $(this).find('.button-text').val().trim();
      
      if (!buttonText) {
        return true; // Skip if no text
      }
      
      const button = {
        text: buttonText
      };
      
      // Add button based on type
      if (buttonType === 'phoneNumber') {
        if (!buttonPhone) {
          showError('Phone number is required for phone number buttons');
          hasError = true;
          return false; // Stop iteration
        }
        button.phoneNumber = buttonPhone;
      } else if (buttonType === 'url') {
        if (!buttonUrl) {
          showError('URL is required for URL buttons');
          hasError = true;
          return false; // Stop iteration
        }
        button.url = buttonUrl;
      } else {
        // ID button
        button.id = buttonId || `btn_${buttons.length + 1}`;
      }
      
      buttons.push(button);
      return true;
    });
    
    if (hasError) {
      return;
    }
    
    if (buttons.length === 0) {
      showError('Please fill in at least one button with text');
      return;
    }
    
    if (buttons.length > 5) {
      showError('Maximum of 5 buttons allowed');
      return;
    }
    
    const token = getLocalStorageItem('token');
    const myHeaders = new Headers();
    myHeaders.append('token', token);
    myHeaders.append('Content-Type', 'application/json');
    
    const payload = {
      number: phone,
      text: title,  // ContentText - mensagem principal
      title: title,  // HeaderText - título (usando o mesmo valor)
      buttons: buttons
    };
    
    if (footer) {
      payload.footer = footer;
    }
    
    const uuid = generateMessageUUID();
    payload.Id = uuid;
    
    const res = await fetch(baseUrl + "/chat/send/buttons", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(payload)
    });
    
    const container = document.getElementById('sendButtonsContainer');
    
    if (container) {
      container.classList.remove('hidden');
      
      let data;
      try {
        const text = await res.text();
        if (!text) {
          throw new Error('Empty response from server');
        }
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        const errorMsg = res.status === 401 ? 'Unauthorized: Please check your token' : 
                        res.status === 500 ? 'Server error: Please try again later' :
                        `Failed to send message: ${res.statusText || 'Unknown error'}`;
        container.innerHTML = `<div class="ui error message">${errorMsg}</div>`;
        return;
      }
      
      if (res.ok && data.code === 200 && data.success) {
        const messageId = data.data?.Id || uuid;
        container.innerHTML = `<div class="ui success message">Message sent successfully! ID: ${messageId}</div>`;
        $('#modalSendButtonsMessage').modal('hide');
        setTimeout(() => {
          $('#sendButtonsForm')[0].reset();
          $('#buttonsContainer').html(`
            <div class="button-field">
              <div class="field">
                <label>Button Type <span class="required">*</span></label>
                <select class="ui dropdown button-type" required>
                  <option value="id">ID (Response Button)</option>
                  <option value="phoneNumber">Phone Number</option>
                  <option value="url">URL</option>
                </select>
                <small>Type of button action</small>
              </div>
              <div class="field button-id-field">
                <label>Button ID</label>
                <input type="text" class="button-id" placeholder="unique-id-1" maxlength="256">
                <small>Unique identifier for response button</small>
              </div>
              <div class="field button-phone-field" style="display: none;">
                <label>Phone Number <span class="required">*</span></label>
                <input type="text" class="button-phone" placeholder="5521989848442" maxlength="20">
                <small>Phone number to call (with country code, no +)</small>
              </div>
              <div class="field button-url-field" style="display: none;">
                <label>URL <span class="required">*</span></label>
                <input type="url" class="button-url" placeholder="https://example.com" maxlength="500">
                <small>URL to open when button is clicked</small>
              </div>
              <div class="field">
                <label>Button Text <span class="required">*</span></label>
                <input type="text" class="button-text" placeholder="Button Label" maxlength="20" required>
                <small>Text displayed on button (max 20 chars)</small>
              </div>
            </div>
          `);
          // Initialize dropdown and handlers
          $('#buttonsContainer .ui.dropdown').dropdown();
          $('#buttonsContainer .button-type').on('change', function() {
            const type = $(this).val();
            const field = $(this).closest('.button-field');
            field.find('.button-id-field').toggle(type === 'id');
            field.find('.button-phone-field').toggle(type === 'phoneNumber');
            field.find('.button-url-field').toggle(type === 'url');
          });
          updateButtonControls();
        }, 2000);
      } else {
        const errorMsg = data.error || data.message || (data.data && typeof data.data === 'string' ? data.data : (data.data && data.data.error)) || `HTTP ${res.status}: ${res.statusText}`;
        container.innerHTML = `<div class="ui error message">Failed to send message: ${errorMsg}</div>`;
      }
    }
  } catch (error) {
    console.error('Error sending buttons message:', error);
    showError('Error sending buttons message: ' + error.message);
  }
}

// List Message Functions
function resetListForm() {
  $('#listSectionsContainer').html(`
    <div class="list-section">
      <div class="field">
        <label>Section Title</label>
        <input type="text" class="section-title" placeholder="Section Name" maxlength="24">
      </div>
      <div class="list-items-container">
        <div class="three fields list-item-field">
          <div class="field">
            <label>Row ID</label>
            <input type="text" class="row-id" placeholder="item1" maxlength="200">
            <small>Unique identifier</small>
          </div>
          <div class="field">
            <label>Title <span class="required">*</span></label>
            <input type="text" class="row-title" placeholder="Item Title" maxlength="24" required>
            <small>Item title (max 24 chars)</small>
          </div>
          <div class="field">
            <label>Description</label>
            <input type="text" class="row-desc" placeholder="Item description" maxlength="72">
            <small>Optional description (max 72 chars)</small>
          </div>
        </div>
      </div>
      <button type="button" class="ui small button add-list-item-btn">
        <i class="plus icon"></i> Add Item to Section
      </button>
      <button type="button" class="ui small button remove-list-item-btn" style="display: none;">
        <i class="minus icon"></i> Remove Last Item
      </button>
    </div>
  `);
  
  // Event listeners are already set up via delegation, so no need to reattach
  updateListItemControls($('#listSectionsContainer .list-section').first());
}

function addListSection() {
  const container = $('#listSectionsContainer');
  const sections = container.find('.list-section');
  
  if (sections.length >= 10) {
    showError('Maximum of 10 sections allowed');
    return;
  }
  
  const newSection = $(`
    <div class="list-section">
      <div class="ui divider"></div>
      <div class="field">
        <label>Section Title</label>
        <input type="text" class="section-title" placeholder="Section Name" maxlength="24">
      </div>
      <div class="list-items-container">
        <div class="three fields list-item-field">
          <div class="field">
            <label>Row ID</label>
            <input type="text" class="row-id" placeholder="item1" maxlength="200">
            <small>Unique identifier</small>
          </div>
          <div class="field">
            <label>Title <span class="required">*</span></label>
            <input type="text" class="row-title" placeholder="Item Title" maxlength="24" required>
            <small>Item title (max 24 chars)</small>
          </div>
          <div class="field">
            <label>Description</label>
            <input type="text" class="row-desc" placeholder="Item description" maxlength="72">
            <small>Optional description (max 72 chars)</small>
          </div>
        </div>
      </div>
      <button type="button" class="ui small button add-list-item-btn">
        <i class="plus icon"></i> Add Item to Section
      </button>
      <button type="button" class="ui small button remove-list-item-btn" style="display: none;">
        <i class="minus icon"></i> Remove Last Item
      </button>
    </div>
  `);
  
  container.append(newSection);
  updateListItemControls(newSection);
  updateSectionControls();
}

function removeListSection() {
  const container = $('#listSectionsContainer');
  const sections = container.find('.list-section');
  
  if (sections.length > 1) {
    sections.last().remove();
  }
  
  updateSectionControls();
}

function attachListItemListeners() {
  // Event listeners are handled via delegation in DOMContentLoaded
  // This function is kept for compatibility but listeners are already set up
}

function addListItem(section) {
  const container = section.find('.list-items-container');
  const items = container.find('.list-item-field');
  
  if (items.length >= 10) {
    showError('Maximum of 10 items per section allowed');
    return;
  }
  
  container.append(`
    <div class="three fields list-item-field">
      <div class="field">
        <label>Row ID</label>
        <input type="text" class="row-id" placeholder="item${items.length + 1}" maxlength="200">
        <small>Unique identifier</small>
      </div>
      <div class="field">
        <label>Title <span class="required">*</span></label>
        <input type="text" class="row-title" placeholder="Item Title" maxlength="24" required>
        <small>Item title (max 24 chars)</small>
      </div>
      <div class="field">
        <label>Description</label>
        <input type="text" class="row-desc" placeholder="Item description" maxlength="72">
        <small>Optional description (max 72 chars)</small>
      </div>
    </div>
  `);
  
  updateListItemControls(section);
}

function removeListItem(section) {
  const container = section.find('.list-items-container');
  const items = container.find('.list-item-field');
  
  if (items.length > 1) {
    items.last().remove();
  }
  
  updateListItemControls(section);
}

function updateListItemControls(section) {
  const items = section.find('.list-item-field');
  const addBtn = section.find('.add-list-item-btn');
  const removeBtn = section.find('.remove-list-item-btn');
  
  if (items.length >= 10) {
    addBtn.prop('disabled', true);
  } else {
    addBtn.prop('disabled', false);
  }
  
  if (items.length > 1) {
    removeBtn.show();
  } else {
    removeBtn.hide();
  }
}

function updateSectionControls() {
  const sections = $('#listSectionsContainer .list-section');
  const addBtn = $('#addSectionBtn');
  const removeBtn = $('#removeSectionBtn');
  
  if (sections.length >= 10) {
    addBtn.prop('disabled', true);
  } else {
    addBtn.prop('disabled', false);
  }
  
  if (sections.length > 1) {
    removeBtn.show();
  } else {
    removeBtn.hide();
  }
}

async function sendListMessage() {
  try {
    const phone = $('#listsendphone').val().trim();
    const topText = $('#listsendtitle').val().trim();
    const desc = $('#listsenddesc').val().trim();
    const buttonText = $('#listsendbuttontext').val().trim();
    const footerText = $('#listsendfooter').val().trim();
    
    if (!phone || !topText || !desc || !buttonText) {
      showError('Please fill in all required fields');
      return;
    }
    
    // Collect sections
    const sections = [];
    $('#listSectionsContainer .list-section').each(function() {
      const sectionTitle = $(this).find('.section-title').val().trim() || 'Menu';
      const rows = [];
      
      $(this).find('.list-item-field').each(function() {
        const rowId = $(this).find('.row-id').val().trim();
        const rowTitle = $(this).find('.row-title').val().trim();
        const rowDesc = $(this).find('.row-desc').val().trim();
        
        if (rowTitle) {
          rows.push({
            title: rowTitle,
            desc: rowDesc || '',
            RowId: rowId || rowTitle
          });
        }
      });
      
      if (rows.length > 0) {
        sections.push({
          title: sectionTitle,
          rows: rows
        });
      }
    });
    
    if (sections.length === 0) {
      showError('Please add at least one item to the list');
      return;
    }
    
    // Check total items
    let totalItems = 0;
    sections.forEach(sec => {
      totalItems += sec.rows.length;
    });
    
    if (totalItems > 10) {
      showError('Maximum of 10 items total allowed across all sections');
      return;
    }
    
    const token = getLocalStorageItem('token');
    const myHeaders = new Headers();
    myHeaders.append('token', token);
    myHeaders.append('Content-Type', 'application/json');
    
    const payload = {
      Phone: phone,
      TopText: topText,
      Desc: desc,
      ButtonText: buttonText,
      Sections: sections
    };
    
    if (footerText) {
      payload.FooterText = footerText;
    }
    
    const uuid = generateMessageUUID();
    payload.Id = uuid;
    
    const res = await fetch(baseUrl + "/chat/send/list", {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(payload)
    });
    
    const container = document.getElementById('sendListContainer');
    
    if (container) {
      container.classList.remove('hidden');
      
      let data;
      try {
        const text = await res.text();
        if (!text) {
          throw new Error('Empty response from server');
        }
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        const errorMsg = res.status === 401 ? 'Unauthorized: Please check your token' : 
                        res.status === 500 ? 'Server error: Please try again later' :
                        `Failed to send list message: ${res.statusText || 'Unknown error'}`;
        container.innerHTML = `<div class="ui error message">${errorMsg}</div>`;
        return;
      }
      
      if (res.ok && data.code === 200 && data.success) {
        const messageId = data.data?.Id || uuid;
        container.innerHTML = `<div class="ui success message">List message sent successfully! ID: ${messageId}</div>`;
        $('#modalSendListMessage').modal('hide');
        setTimeout(() => {
          $('#sendListForm')[0].reset();
          resetListForm();
        }, 2000);
      } else {
        const errorMsg = data.error || data.message || (data.data && typeof data.data === 'string' ? data.data : (data.data && data.data.error)) || `HTTP ${res.status}: ${res.statusText}`;
        container.innerHTML = `<div class="ui error message">Failed to send list message: ${errorMsg}</div>`;
      }
    }
  } catch (error) {
    console.error('Error sending list message:', error);
    showError('Error sending list message: ' + error.message);
  }
}
