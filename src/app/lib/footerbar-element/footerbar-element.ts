import { IconParams, IconProp } from '@fortawesome/fontawesome-svg-core';
import { IFooterBarElement } from './interfaces';

export class FooterbarElement implements IFooterBarElement {
  get introTranslate(): string {
    return this._introTranslate;
  }

  get selectable(): boolean {
    return this._selectable;
  }

  get showIntro(): boolean {
    return this._showIntro;
  }

  get id(): string {
    return this._id;
  }

  get iconLayer(): Array<IconParams> {
    return this._iconLayer;
  }

  get iconClass(): IconProp {
    return this._iconClass;
  }

  set iconClass(value: IconProp) {
    this._iconClass = value;
  }

  get iconColorClass(): string {
    return this._iconColorClass;
  }

  get textClass(): string {
    return this._textClass;
  }

  get textName(): string {
    return this._textName;
  }

  private _onClickCallback: Function;

  get onClickCallback(): Function {
    return this._onClickCallback;
  }

  set onClickCallback(value: Function) {
    if (!this._restoreOnClickCallback) {
      this._restoreOnClickCallback = this._onClickCallback;
    }
    this._onClickCallback = value;
  }

  private _linkTarget: Function | Array<string>;

  get linkTarget(): Function | Array<string> {
    return this._linkTarget;
  }

  set linkTarget(value: Function | Array<string>) {
    this._linkTarget = value;
  }

  private _isActive: boolean;

  get isActive(): boolean {
    return this._isActive;
  }

  set isActive(value: boolean) {
    this._isActive = value;
  }

  get queryParams(): object {
    return this._queryParams;
  }

  private _isLoading: boolean;

  get isLoading(): boolean {
    return this._isLoading;
  }

  set isLoading(value: boolean) {
    this._isLoading = value;
  }

  private _loadingBarState: number;

  get loadingBarState(): number {
    return this._loadingBarState;
  }

  set loadingBarState(value: number) {
    this._loadingBarState = value;
  }

  private _restoreOnClickCallback: Function;
  private _iconClass: IconProp;
  private readonly _introTranslate: string;
  private readonly _id: string;
  private readonly _iconLayer: Array<IconParams>;
  private readonly _iconColorClass: string;
  private readonly _textClass: string;
  private readonly _textName: string;
  private readonly _selectable: boolean;
  private readonly _showIntro: boolean;
  private readonly _queryParams: object;

  constructor({
                id, //
                iconLayer, //
                iconClass, //
                iconColorClass, //
                textClass, //
                textName, //
                selectable, //
                showIntro, //
                introTranslate, //
                isActive, //
                linkTarget, //
                queryParams, //
                isLoading, //
                loadingBarState, //
              }: IFooterBarElement, onClickCallback?: Function) {
    this._id = id;
    this._iconLayer = iconLayer;
    this._iconClass = iconClass;
    this._iconColorClass = iconColorClass;
    this._textClass = textClass;
    this._textName = textName;
    this._selectable = selectable;
    this._showIntro = showIntro;
    this._introTranslate = introTranslate;
    this._isActive = isActive;
    this._linkTarget = linkTarget;
    this._queryParams = queryParams;
    this._isLoading = isLoading;
    this._loadingBarState = loadingBarState || 0;
    this.onClickCallback = onClickCallback;
  }

  public restoreClickCallback(): void {
    if (!this._restoreOnClickCallback) {
      return;
    }
    this._onClickCallback = this._restoreOnClickCallback;
  }
}
