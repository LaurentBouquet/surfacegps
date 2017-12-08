// Copyright (C) 2017 Laurent Bouquet
// 
// This file is part of SurfaceGPS.
// 
// SurfaceGPS is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// SurfaceGPS is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with SurfaceGPS.  If not, see <http://www.gnu.org/licenses/>.
// 

import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { IonicPage, NavController, ToastController } from 'ionic-angular';

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

  constructor(public navCtrl: NavController, public toastCtrl: ToastController, public translateService: TranslateService) {
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
