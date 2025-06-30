export const uiTexts = {
  notifications: {
    errors: {
        settingsApiKey: 'You need to enter your API key in plugin settings',
        settingsURL: 'You need to enter Redmine URL in plugin settings',
        settingsInvalidApiKey: 'Enter a valid API key in settings, or check your rights in Redmine'
    },
    info: {
        successfullySync: "Tickets updated successfully"
    }
  },
  settings: {
      apiKey: {
         name: 'Redmine API key',
         desc: 'Your Redmine API Key',
         placeholder: 'Enter API key',
      },
      url: {
          name: 'Redmine URL',
          desc: 'Redmine domain url',
          placeholder: 'Enter url example: https://my.redmine.com/',
      },
      showTableProperties: {
          name: 'Show issue information',
          desc: 'Show basic issue information display as a table in notes (need to resync issues)'
      }
  }
}
