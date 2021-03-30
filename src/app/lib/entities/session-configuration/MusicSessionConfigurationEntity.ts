import { DefaultSettings } from '../../default.settings';
import { MusicTitleSessionConfigurationEntity } from './MusicTitleSessionConfigurationEntity';
import { MusicVolumeSessionConfigurationEntity } from './MusicVolumeSessionConfigurationEntity';

export class MusicSessionConfigurationEntity {
  public enabled = {
    lobby: DefaultSettings.defaultQuizSettings.sessionConfig.music.enabled.lobby,
    countdownRunning: DefaultSettings.defaultQuizSettings.sessionConfig.music.enabled.countdownRunning,
    countdownEnd: DefaultSettings.defaultQuizSettings.sessionConfig.music.enabled.countdownEnd,
  };
  public shared = {
    lobby: DefaultSettings.defaultQuizSettings.sessionConfig.music.shared.lobby,
    countdownRunning: DefaultSettings.defaultQuizSettings.sessionConfig.music.shared.countdownRunning,
    countdownEnd: DefaultSettings.defaultQuizSettings.sessionConfig.music.shared.countdownEnd,
  };

  public volumeConfig: MusicVolumeSessionConfigurationEntity;
  public titleConfig: MusicTitleSessionConfigurationEntity;

  constructor(props) {
    this.enabled = props.enabled ?? this.enabled;
    this.shared = props.shared ?? this.shared;
    this.volumeConfig = props.volumeConfig ?? this.volumeConfig;
    this.titleConfig = props.titleConfig ?? this.titleConfig;
  }

  public equals(value: MusicSessionConfigurationEntity): boolean {
    return (this.volumeConfig.global === value.volumeConfig.global && //
            this.volumeConfig.lobby === value.volumeConfig.lobby && //
            this.volumeConfig.countdownRunning === value.volumeConfig.countdownRunning && //
            this.volumeConfig.countdownEnd === value.volumeConfig.countdownEnd && //
            this.titleConfig.lobby === value.titleConfig.lobby && //
            this.titleConfig.countdownRunning === value.titleConfig.countdownRunning && //
            this.titleConfig.countdownEnd === value.titleConfig.countdownEnd && //
            this.enabled.lobby === value.enabled.lobby && //
            this.enabled.countdownRunning === value.enabled.countdownRunning && //
            this.enabled.countdownEnd === value.enabled.countdownEnd && //
            this.shared.lobby === value.shared.lobby && //
            this.shared.countdownRunning === value.shared.countdownRunning && //
            this.shared.countdownEnd === value.shared.countdownEnd //
    );
  }
}
