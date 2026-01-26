function switchTab(event, tabName) {
      const tabs = document.querySelectorAll('.settings-tab');
      const sections = document.querySelectorAll('.settings-section');
      
      tabs.forEach(tab => tab.classList.remove('active'));
      sections.forEach(section => section.classList.remove('active'));
      
      event.target.classList.add('active');
      document.getElementById(tabName).classList.add('active');
    }

    function toggleSwitch(button) {
      button.classList.toggle('on');
    }

    document.addEventListener('DOMContentLoaded', function() {
      const userName = sessionStorage.getItem('userName');
      if (userName) {
        document.getElementById('profileName').textContent = userName;
      }
    });