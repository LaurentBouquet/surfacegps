import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IonicPage, NavController, ToastController } from 'ionic-angular';

import { User } from '../../providers/providers';
//import { MainPage } from '../pages';

declare function require(url: string);

@IonicPage()
@Component({
  selector: 'page-about',
  templateUrl: 'about.html'
})

export class AboutPage {

  appName: string;
  packageName: string;
  versionCode: string;
  versionNumber: string;

  constructor(public navCtrl: NavController, public user: User, public toastCtrl: ToastController, public translateService: TranslateService) {
    var pckg = require('../../../package.json');
    this.versionNumber = pckg.version;
  }

  public mailto(address: string, subject: string):void {
    let Link="mailto:"+address+"?subject="+subject;
    window.open(Link, "_system");
  }
  
  public browseto(address: string):void {
    let Link=address;
    window.open(Link, "_blank");
  }
  
}
