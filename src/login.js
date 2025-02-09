const { By, Builder, until, Browser } = require('selenium-webdriver');

const config = require('config');
let isFirstIteration = true;
const maxPageLoadWaitMs = 60000;


(async function firstTest() {
  let driver;

  try {
    driver = await new Builder().forBrowser(Browser.CHROME).build();
    driver.manage().window().setRect({ width: 1280, height: 800, x: 0, y: 0 });
    await driver.get(config.get('website'));
    await driver.manage().setTimeouts({ implicit: maxPageLoadWaitMs });

    //// Login
    const signInMenuLink = await driver.findElement(By.css("div#menu_myaccount a.menuitem"));
    await signInMenuLink.click();

    await new Promise(resolve => setTimeout(resolve, config.get('loginWaitMs')));

    //// Navigate to Family Camping
    const headerMenuItems = await driver.findElements(By.css('#header-top li:has(.menuitem)'));
    const menuItemSearch = await findByText(headerMenuItems, 'SEARCH');

    if (menuItemSearch) {
      const menuItemText = await menuItemSearch.getText();
      console.log("Found menuItemSearch! ", menuItemText);
      await menuItemSearch.click();
    } else {
      console.log("Not found...");
    }

    const subMenuItems = await menuItemSearch.findElements(By.css('.submenu a.menuitem'));
    const menuItemFamilyCamping = await findByText(subMenuItems, 'Family Camping');
    if (menuItemFamilyCamping) {
      const familyCampingText = await menuItemFamilyCamping.getText();
      console.log("Found menuItemFamilyCamping! ", familyCampingText);

      await menuItemFamilyCamping.click();
    } else {
      console.log("Not found...");
    }

    //Begin Date    
    const beginDateToggle = await driver.findElement(By.id('begindate_vm_6_button'));
    await beginDateToggle.click();

    //Begin Date - Month
    const beginDateMonthToggle = await driver.findElement(By.css('button#begindate_vm_6_month_selection_button'));
    await beginDateMonthToggle.click();
    const beginDateMonthOptions = await driver.findElements(By.css('button#begindate_vm_6_month_selection_button + div > ul > li'))
    const desiredMonth = await findByText(beginDateMonthOptions, config.get('filters.beginDate.month'));
    await desiredMonth.click();

    //Begin Date - Day
    const beginDateDayToggle = await driver.findElement(By.css('button#begindate_vm_6_day_selection_button'));
    await beginDateDayToggle.click();
    const beginDateDayOptions = await driver.findElements(By.css('button#begindate_vm_6_day_selection_button + div > ul > li'))
    const desiredDay = await findByText(beginDateDayOptions, config.get('filters.beginDate.day'));
    await desiredDay.click();

    //Begin Date - Year
    const beginDateYearToggle = await driver.findElement(By.css('button#begindate_vm_6_year_selection_button'));
    await beginDateYearToggle.click();
    const beginDateYearOptions = await driver.findElements(By.css('button#begindate_vm_6_year_selection_button + div > ul > li'))
    const desiredYear = await findByText(beginDateYearOptions, config.get('filters.beginDate.year'));
    await desiredYear.click();

    const beginDateButtons = await driver.findElements(By.css('#begindate_vm_6_wrap button'))
    const beginDateDoneButton = await findByText(beginDateButtons, 'Done');
    await beginDateDoneButton.click();

    //Nights
    const nightsToggle = await driver.findElement(By.css('button#nights_vm_1_button'));
    await nightsToggle.click();
    const nightsOptions = await driver.findElements(By.css('button#nights_vm_1_button + div > ul > li'))
    const desiredNight = await findByText(nightsOptions, config.get('filters.nights'));
    await desiredNight.click();

    //Park
    const parkOptionsSectionCollapseButton = await driver.findElement(By.css("div.newline.search-criteria.newline-combobox:has(label[for=category]) > button"));
    await parkOptionsSectionCollapseButton.click();
    const parksOptions = await driver.findElements(By.css('#category_vm_2_wrap ul > li'));
    const desiredPark = await findByText(parksOptions, config.get('filters.park'));
    driver.executeScript("arguments[0].scrollIntoView(true);", desiredPark);
    await new Promise(resolve => setTimeout(resolve, 500));
    await desiredPark.click();

    //Site Search (keyword)
    const siteSearchButton = await driver.findElement(By.css("div.newline.search-criteria.newline-fillin:has(label[for=keyword]) > button"));
    await siteSearchButton.click();
    const siteSearchInput = await driver.findElement(By.css("button.filter-collapsible.valid ~ div.field-wrap.fillin-field-wrap > input.fillin.character"));
    driver.executeScript("arguments[0].setAttribute('value', arguments[1])", siteSearchInput, config.get('filters.siteSearch'));


    //Loop control variables
    let hasDesiredSiteSecuredInCart = false;
    let hasAnyAvailableSites = false;
    do {
      //Apply filters
      const searchButton = await driver.findElement(By.css('button#rnwebsearch_buttonsearch'));
      await searchButton.click();

      //Select first available of desired sites
      const allDesiredSiteRows = await driver.findElements(By.css('table#rnwebsearch_output_table > tbody > tr'));

      const allDesiredSiteRowsAndProperties = await Promise.all(
        allDesiredSiteRows.map(async row => ({
          row: row,
          checkbox: await row.findElement(By.css("td[data-title='Add to Cart'] > a")),
          siteName: await (await row.findElement(By.css("td[data-title='Site/Item #']"))).getText()
        }))
      );

      const desiredSiteStrList = config.get('desiredSiteList');
      const desiredSites = desiredSiteStrList.map(desiredSiteStr =>
        allDesiredSiteRowsAndProperties.find(x => x.siteName === desiredSiteStr)
      );

      hasDesiredSiteSecuredInCart = false;
      hasAnyAvailableSites = false;
      for (let desiredSite of desiredSites) {
        const isAvailable = (await desiredSite.checkbox.getAttribute("data-tooltip")) === "Add To Selection List";
        console.log("Desired Site: ", desiredSite.siteName, isAvailable);
        if (isAvailable) {
          hasAnyAvailableSites = true;
          await desiredSite.checkbox.click();

          if (isFirstIteration) {
            const hour = config.get("firstAttemptStartTime.hour");
            const minute = config.get("firstAttemptStartTime.minute");
            const second = config.get("firstAttemptStartTime.second");
            await waitUntil(hour, minute, second);
            isFirstIteration = false;
          }

          const addToCartButton = await driver.findElement(By.css("button.button.primary.multiselectlist__addbutton"));
          await addToCartButton.click();

          if (config.get("selectHouseHoldMember") === true) {            
            const familyMemberSelectionPageHeader = await driver.findElement(By.css("#content h1.page-header"));
            const familyMemberSelectionPageHeaderText = await familyMemberSelectionPageHeader.getText();

            if (familyMemberSelectionPageHeaderText === "Family Member Selection") {
              const familySelectionButtonGroup = await driver.findElements(By.css("#group20 button, #group20 a"));
              // await driver.wait(until.elementIsVisible(revealed), 2000);
              const continueFamilySelectionButton = await findByText(familySelectionButtonGroup, "Continue");
              const backFamilySelectionButton = await findByText(familySelectionButtonGroup, "Back");
  
              if (continueFamilySelectionButton !== undefined) {
                console.log("Selecting family member");
                const familyMemberSelection = await driver.findElement(By.css("div.group.webaddtocartmatrix__membergroup div.field-wrap.checkbox-field-wrap:has(input.checkbox)"));
                await familyMemberSelection.click();
    
                const continueCartButton = await driver.findElement(By.css("button#button201"));
                await continueCartButton.click();
              } else if (backFamilySelectionButton !== undefined) {
                console.log("Failure to select family member. Pressing back...");
                await backFamilySelectionButton.click();
                
                const clearFromCartButton = await driver.findElement(By.css("button.button.multiselectlist__clearbutton"));
                await clearFromCartButton.click();

                break;
              } else {
                console.log("Unknown case while in family selection! Could not find continue or back button");
              }
            } else {
              console.log("Was not in the family member selection!");
            }
          }

          const checkoutPageHeader = await driver.findElement(By.css("#content h1.page-header"));
          const checkoutPageHeaderText = await checkoutPageHeader.getText();

          const cartCheckoutButtonGroup = await driver.findElements(By.css("#processingprompts_buttongroup button, #processingprompts_buttongroup a"));
          const continueCheckoutButton = await findByText(cartCheckoutButtonGroup, "Continue");
          const cancelCheckoutButton = await findByText(cartCheckoutButtonGroup, "Cancel");

          if (checkoutPageHeaderText.includes("(Purchase)") && continueCheckoutButton !== undefined) {
            hasDesiredSiteSecuredInCart = true;
            console.log("Desired Site is in cart with 'Continue' button: ", continueCheckoutButton);
          } else if (cancelCheckoutButton !== undefined) {
            console.log("Failure to secure site. Cancelling...");

            driver.executeScript("arguments[0].scrollIntoView(true);", cancelCheckoutButton);
            await new Promise(resolve => setTimeout(resolve, 250));

            await cancelCheckoutButton.click();
          } else {
            console.log("Unknown case while in cart! Could not find continue or cancel button");
          }

          break;
        }
      }
    } while (!hasDesiredSiteSecuredInCart);


    if (hasDesiredSiteSecuredInCart) {
      console.log("Site secured in cart!");
    }
    if (!hasAnyAvailableSites) {
      console.log("Unable to find any desired site... Sorry");
    }




  } catch (e) {
    console.log(e)
  } finally {
    // await driver.quit();
  }
}());



async function findByText(elements, text) {
  for (let el of elements) {
    const elText = await el.getText();
    if (elText === text) {
      return el;
    }
  }
}

async function waitUntil(hours, minutes, seconds) {
  const now = new Date();
  const targetTime = new Date();
  targetTime.setHours(hours, minutes, seconds, 0);
  const delay = targetTime - now;

  await new Promise(resolve => setTimeout(resolve, delay))
}