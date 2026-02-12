import { imageApi } from './image';
import { contentApi } from './content';
import { audioApi } from './audio';
import { chatApi } from './chat';
import { personalSettingsApi, mySettingsApi } from './settings';
import { providersApi } from './providers';
import { modelsApi } from './models';

export const aiApi = {
    image: imageApi,
    content: contentApi,
    audio: audioApi,
    chat: chatApi,
    personalSettings: personalSettingsApi,
    providers: providersApi,
    models: modelsApi,
    mySettings: mySettingsApi,
};

