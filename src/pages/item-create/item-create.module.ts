import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IonicPageModule } from 'ionic-angular';
//import { SQLite } from '@ionic-native/sqlite';

import { ItemCreatePage } from './item-create';


@NgModule({
  declarations: [
    ItemCreatePage,
  ],
  imports: [
    IonicPageModule.forChild(ItemCreatePage),
    TranslateModule.forChild()
  ],
  exports: [
    ItemCreatePage
  ]/*,
  providers: [
    SQLite
  ]*/
})
export class ItemCreatePageModule { }
