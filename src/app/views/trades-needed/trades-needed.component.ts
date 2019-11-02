import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { PortfolioTemplate, PortfolioComponent, PassivPosition, PassivTarget, PassivCurrency, PassivBalance, PassivTradeRequest, PassivTradeResponse, PassivTrade } from '../../models';
import { WidgetView } from '../widget-view';
import { PassivService } from 'src/app/services/passiv.service';

@Component({
  selector: 'app-trades-needed',
  templateUrl: './trades-needed.component.html',
  styleUrls: ['./trades-needed.component.scss']
})
export class TradesNeededComponent implements OnInit {

  portfolio: PortfolioTemplate;
  currentView: WidgetView;
  cash = 0;
  buyOnly = false;
  specificCash = 0;
  loading = false;

  @Output() switchView: EventEmitter<WidgetView> = new EventEmitter();

  constructor(private passivService: PassivService) { }

  ngOnInit() {

  }

  adjustmentNeeded(component: PortfolioComponent): string {
    if (component !== null) {
      const correctShares = (component.percentOfPortfolio * this.totalPortfolioValue()) / parseFloat(component.price);
      const adjustment = Math.round(correctShares - component.sharesOwned);
      if (adjustment < 0) {
        return adjustment.toString();
      } else {
        return '+' + adjustment;
      }
    } else {
      return '---';
    }
  }

  totalPortfolioValue() {
    let totalValue = 0;
    this.portfolio.components.forEach(component => {
      totalValue += parseFloat(component.price) * component.sharesOwned;
    });
    return totalValue;
  }

  buyOnlyToggle() {
    this.buyOnly = !this.buyOnly;
    this.refreshTradesNeeded();
  }

  refreshTradesNeeded() {
    this.loading = true;
    this.portfolio.components.forEach(component => {
      component.adjustmentUnits = 0;
    });
    if (this.portfolio !== null) {
      const positions: PassivPosition[] = [];
      const balances: PassivBalance[] = [];
      const targets: PassivTarget[] = [];
      this.portfolio.components.forEach(component => {
        positions.push(new PassivPosition(component.symbol, component.sharesOwned));
        targets.push(new PassivTarget(component.symbol, component.percentOfPortfolio * 100));
      });
      if (this.specificCash === 0) {
        balances.push(new PassivBalance('cad', this.cash));
      } else {
        balances.push(new PassivBalance('cad', this.specificCash));
      }
      this.passivService.getTrades(new PassivTradeRequest(positions, balances, targets, this.buyOnly))
      .subscribe(tradeResponse => {
        (tradeResponse as PassivTrade[]).forEach(trade => {
          this.portfolio.components.forEach(component => {
            if (trade.symbol === component.symbol) {
              component.price = trade.price.toString();
              component.adjustmentUnits = trade.units;
              component.adjustmentAction = trade.action;
            }
          });
        });
        this.loading = false;
      });
    }
  }

  portfolioDetails() {
    this.switchView.emit(WidgetView.PortfolioDetails);
  }

}
