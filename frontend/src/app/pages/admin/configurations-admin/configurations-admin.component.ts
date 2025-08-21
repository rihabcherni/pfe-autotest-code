import { Component } from '@angular/core';
import { TitleComponent } from "../../../components/shared/title/title.component";

@Component({
  selector: 'app-configurations-admin',
  standalone: true,
  imports: [TitleComponent],
  templateUrl: './configurations-admin.component.html',
  styleUrl: './configurations-admin.component.css'
})
export class ConfigurationsAdminComponent {
  titleValue="Configurations";

}
