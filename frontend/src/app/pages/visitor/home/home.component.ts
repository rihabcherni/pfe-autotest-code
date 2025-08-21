import { Component } from '@angular/core';
import { AboutUsComponent } from '../../../components/visitor/about-us/about-us.component';
import { FaqComponent } from "../../../components/visitor/faq/faq.component";
import { ContactUsComponent } from "../../../components/visitor/contact-us/contact-us.component";
import { FeaturesComponent } from "../../../components/visitor/features/features.component";
import { ServicesComponent } from "../../../components/visitor/services/services.component";
import { RouterLink } from '@angular/router';
import { HeroComponent } from "../../../components/visitor/hero/hero.component";
import { PricingComponent } from "../../../components/visitor/pricing/pricing.component";
import { StatsComponent } from "../../../components/visitor/stats/stats.component";
import { TestimonialsComponent } from "../../../components/visitor/testimonials/testimonials.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, AboutUsComponent, FaqComponent, ContactUsComponent, FeaturesComponent, ServicesComponent, HeroComponent, PricingComponent, StatsComponent, TestimonialsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
