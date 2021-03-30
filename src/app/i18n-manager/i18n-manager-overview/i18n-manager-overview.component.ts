import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Filter, Project } from '../../lib/enums/enums';
import { FooterBarService } from '../../service/footer-bar/footer-bar.service';
import { HeaderLabelService } from '../../service/header-label/header-label.service';
import { LanguageLoaderService } from '../../service/language-loader/language-loader.service';
import { ModalOrganizerService } from '../../service/modal-organizer/modal-organizer.service';
import { ProjectLoaderService } from '../../service/project-loader/project-loader.service';
import { UserService } from '../../service/user/user.service';

@Component({
  selector: 'app-i18n-manager-overview',
  templateUrl: './i18n-manager-overview.component.html',
  styleUrls: ['./i18n-manager-overview.component.scss'],
})
export class I18nManagerOverviewComponent implements OnInit, OnDestroy {
  public static readonly TYPE = 'I18nManagerOverviewComponent';

  private _searchFilter = '';
  private _unusedKeyFilter: boolean;
  private _filter = Filter.None;
  private _hasAnyMatches = of(false);
  private changedData: EventEmitter<void> = new EventEmitter<void>();

  public readonly filters = Filter;
  public unauthorized: boolean;
  public loading = true;
  public error: boolean;
  public isSubmitting: boolean;

  get searchFilter(): string {
    return this._searchFilter;
  }

  set searchFilter(value: string) {
    this._searchFilter = value;
    this.languageLoaderService.selectedKey = null;
  }

  get unusedKeyFilter(): boolean {
    return this._unusedKeyFilter;
  }

  set unusedKeyFilter(value: boolean) {
    this.languageLoaderService.selectedKey = null;
    this._unusedKeyFilter = value;
  }

  get filter(): Filter {
    return this._filter;
  }

  set filter(value: Filter) {
    this.hasAnyMatches = of(false);
    switch (parseInt(String(value), 10)) {
      case 0:
        this._filter = Filter.None;
        return;
      case 2:
        this._filter = Filter.InvalidKeys;
        return;
      case 3:
        this._filter = Filter.InvalidDE;
        return;
      case 4:
        this._filter = Filter.InvalidEN;
        return;
      default:
        throw Error(`Unknown filter set: ${value}`);
    }
  }

  get hasAnyMatches(): Observable<boolean> {
    return this._hasAnyMatches;
  }

  set hasAnyMatches(value: Observable<boolean>) {
    this._hasAnyMatches = value;
  }

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private footerBarService: FooterBarService,
    private headerLabelService: HeaderLabelService,
    public languageLoaderService: LanguageLoaderService,
    public modalOrganizerService: ModalOrganizerService,
    public projectLoaderService: ProjectLoaderService,
    public userService: UserService,
    private cd: ChangeDetectorRef,
  ) {
    this.headerLabelService.headerLabel = 'I18Nator';
    this.footerBarService.replaceFooterElements([]);
  }

  public ngOnInit(): void {
    this.setProject(Project.Frontend);

    if (isPlatformBrowser(this.platformId)) {
      const contentContainer = document.getElementsByClassName('container');

      if (contentContainer && contentContainer.length) {
        contentContainer[0].classList.add('container-lg');
        contentContainer[0].classList.remove('container');
      }
    }
  }

  public ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      const contentContainer = document.getElementsByClassName('container-lg');

      if (contentContainer && contentContainer.length) {
        contentContainer[0].classList.add('container');
        contentContainer[0].classList.remove('container-lg');
      }
    }
  }

  public updateData(): void {
    this.isSubmitting = true;
    this.languageLoaderService.updateProject().subscribe({
      next: () => this.isSubmitting = false,
      error: () => this.isSubmitting = false,
    });
  }

  public changeFilter(filter: string | number): void {
    this.filter = parseInt(String(filter), 10);
    this.languageLoaderService.selectedKey = null;
  }

  public setProject(value: Project | string): void {
    this.languageLoaderService.selectedKey = null;
    this._searchFilter = '';
    this.loading = true;
    this.error = false;
    this.unauthorized = false;
    this.languageLoaderService.reset();
    this.projectLoaderService.currentProject = value as Project;

    this.reloadLanguageData();
  }

  public dataChanged(key: { key: string; value: { [key: string]: string } }): void {
    this.languageLoaderService.selectedKey = key;
    this.languageLoaderService.changed.next();
  }

  public getKeys(dataNode: object): Array<string> {
    if (!dataNode) {
      return [];
    }
    return Object.keys(dataNode).sort();
  }

  public updateKey(event, langRef, key): void {
    const value = event.target.value;

    this.languageLoaderService.changedData = true;

    if (!value.length) {
      delete key.value[langRef];

    } else {
      key.value[langRef] = value;

    }

  }

  public isUnusedKey(): boolean {
    return !!this.languageLoaderService.unusedKeys.find(unusedKey => unusedKey === this.languageLoaderService.selectedKey?.key);
  }

  public addKey(): void {
    this.modalOrganizerService.addKey().then(() => this.cd.markForCheck());
    this.changedData.next();
  }

  private reloadLanguageData(): void {
    this.languageLoaderService.getLangData().subscribe({
      next: () => {
        this.loading = false;
        this.error = false;
        this.unauthorized = false;
      },
      error: err => {
        this.loading = false;
        this.error = true;
      },
    });
  }
}
