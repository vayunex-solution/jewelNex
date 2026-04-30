document.addEventListener('DOMContentLoaded', () => {
    // Helper to get element safely
    const el = (id) => document.getElementById(id);

    const itemsTableBody = el('invoice-items');
    const addRowBtn = el('add-row-btn');
    const saveBtn = el('save-invoice-btn');
    const dateInput = el('invoice-date');
    const gstInput = el('gst-rate-input');
    const paidInput = el('paid-amount');
    const typeSelect = el('invoice-type');
    
    // Bill Settings from server
    const BS = window.BILL_SETTINGS || {};

    console.log("Invoice System Loading...", BS);

    let masterItems = [];
    let masterCustomers = [];
    let shopSettings = null;
    let customerInitialBalance = { gold: 0, silver: 0, amount: 0, amountType: 'Dr' };

    // Apply column visibility from Bill Settings
    function applyColumnVisibility() {
        const colMap = {
            'bill-col-metal': BS.showMetal !== false,
            'bill-col-purity': BS.showPurity !== false,
            'bill-col-finewt': BS.showFineWt !== false,
            'bill-col-rate': BS.showRate !== false,
            'bill-col-metalamt': BS.showMetalAmt !== false,
            'bill-col-makingpct': BS.showMakingPct !== false,
            'bill-col-makingamt': BS.showMakingAmt !== false
        };

        Object.entries(colMap).forEach(([cls, show]) => {
            document.querySelectorAll(`.${cls}`).forEach(cell => {
                cell.style.display = show ? '' : 'none';
            });
        });
    }

    // Initialize listeners
    if (addRowBtn) {
        addRowBtn.onclick = (e) => {
            if (e) e.preventDefault();
            window.addRow();
        };
    }

    if (gstInput) gstInput.oninput = calculateInvoice;
    if (el('daily-rate')) el('daily-rate').oninput = calculateInvoice;
    if (el('silver-rate')) el('silver-rate').oninput = calculateInvoice;
    if (el('gst-type-select')) el('gst-type-select').onchange = calculateInvoice;
    const dInput = el('discount-input');
    if (dInput) dInput.addEventListener('input', calculateInvoice);
    if (paidInput) paidInput.addEventListener('input', updateOutstanding);
    if (typeSelect) {
        typeSelect.addEventListener('change', () => {
            fetchNextNumber();
            calculateInvoice();
        });
    }

    // Opening balance fields for manual entry
    if (el('cust-opening-bal')) el('cust-opening-bal').oninput = calculateInvoice;
    if (el('cust-bal-type')) el('cust-bal-type').onchange = calculateInvoice;
    if (el('cust-opening-gold')) el('cust-opening-gold').oninput = calculateInvoice;
    if (el('cust-opening-silver')) el('cust-opening-silver').oninput = calculateInvoice;

    // Bhav Cut Listeners
    if (el('enable-bhav-cut')) {
        el('enable-bhav-cut').onchange = (e) => {
            el('bhav-cut-fields').style.display = e.target.checked ? 'block' : 'none';
            calculateInvoice();
        };
    }
    if (el('bhav-cut-cash')) el('bhav-cut-cash').oninput = calculateBhavCut;
    if (el('bhav-cut-rate')) el('bhav-cut-rate').oninput = calculateBhavCut;
    if (el('bhav-cut-metal-type')) el('bhav-cut-metal-type').onchange = calculateInvoice;
    if (el('bhav-cut-weight')) el('bhav-cut-weight').oninput = calculateInvoice;

    function calculateBhavCut() {
        const cash = parseFloat(el('bhav-cut-cash')?.value) || 0;
        const rate = parseFloat(el('bhav-cut-rate')?.value) || 0;
        const resultEl = el('bhav-cut-result-raw');
        
        if (rate > 0) {
            const weight = (cash / rate).toFixed(3);
            if (resultEl) {
                resultEl.innerHTML = `${weight} g <button type="button" class="btn-apply-weight" title="Apply this weight" style="background: var(--primary-gold); color: white; border: none; border-radius: 4px; padding: 2px 8px; font-size: 0.7rem; cursor: pointer; margin-left: 10px;">Apply</button>`;
                resultEl.querySelector('.btn-apply-weight').onclick = () => {
                    const weightInput = el('bhav-cut-weight');
                    if (weightInput) {
                        weightInput.value = weight;
                        calculateInvoice();
                    }
                };
            }
        } else {
            if (resultEl) resultEl.textContent = `0.000 g`;
        }
        calculateInvoice();
    }


    if (el('print-option')) {
        el('print-option').addEventListener('change', () => {
            calculateInvoice();
            // Visual feedback effect
            const breakdown = document.querySelector('.total-breakdown');
            if (breakdown) {
                breakdown.style.transform = 'scale(1.02)';
                setTimeout(() => breakdown.style.transform = 'scale(1)', 200);
            }
        });
    }

    async function fetchNextNumber() {
        if (!typeSelect) return;
        try {
            const type = typeSelect.value;
            const res = await fetch(`/Invoices/GetNextInvoiceNumber?type=${encodeURIComponent(type)}`);
            if (res.ok) {
                const num = await res.text();
                if (el('invoice-no')) el('invoice-no').value = num;
            }
        } catch (err) {
            console.error("Next number fetch failed:", err);
        }
    }

    // Fetch Master Data on Load
    async function loadMasterData() {
        try {
            const [itemRes, custRes, settingsRes] = await Promise.all([
                fetch('/ItemMaster/GetAllItems'),
                fetch('/Customers/GetAllCustomers'),
                fetch('/Settings/GetSettings')
            ]);
            
            if (itemRes.ok) masterItems = await itemRes.json();
            if (custRes.ok) masterCustomers = await custRes.json();
            if (settingsRes.ok) shopSettings = await settingsRes.json();

            // Populate Customer Dropdown
            const custSelect = el('cust-name-select');
            if (custSelect) {
                const options = Array.from(custSelect.options);
                options.forEach(opt => { if(opt.value && opt.value !== 'custom') opt.remove(); });
                
                masterCustomers.forEach(c => {
                    const opt = document.createElement('option');
                    opt.value = c.id;
                    opt.textContent = c.name;
                    custSelect.insertBefore(opt, custSelect.options[custSelect.options.length-1]);
                });
            }
            return true;
        } catch (err) {
            console.error("Failed to load master data:", err);
        }
        return false;
    }

    async function fetchCustomerBalance(id) {
        try {
            const res = await fetch(`/Customers/GetCustomerBalance/${id}`);
            if (res.ok) {
                const data = await res.json();
                customerInitialBalance = {
                    gold: data.gold,
                    silver: data.silver,
                    amount: data.amount,
                    amountType: data.amountType
                };
                
                el('customer-balance-info').style.display = "block";
                calculateInvoice(); // Trigger recalculation with new initial balance
            }
        } catch (err) {
            console.error("Failed to fetch customer balance:", err);
        }
    }

    // Customer Selection Logic
    const custSelect = el('cust-name-select');
    const newCustContainer = el('new-cust-fields');
    if (custSelect) {
        custSelect.onchange = () => {
            const val = custSelect.value;
            const nameInput = el('cust-name');
            const mobileInput = el('cust-mobile');
            const gstinInput = el('cust-gstin');
            const addressInput = el('cust-address');
            const gstTypeSelect = el('gst-type-select');

            // Helper to set readonly state
            const setType = (isReadOnly) => {
                [nameInput, mobileInput, gstinInput, addressInput].forEach(i => {
                    if (i) i.readOnly = isReadOnly;
                });
            };

            if (val === "custom") {
                if (newCustContainer) newCustContainer.style.display = "block";
                setType(false);
                if (nameInput) nameInput.value = "";
                if (mobileInput) mobileInput.value = "";
                if (gstinInput) gstinInput.value = "";
                if (addressInput) addressInput.value = "";
                if (el('cust-opening-bal')) el('cust-opening-bal').value = "0";
                if (el('cust-bal-type')) el('cust-bal-type').value = "1";
                if (el('cust-opening-gold')) el('cust-opening-gold').value = "0.000";
                if (el('cust-opening-silver')) el('cust-opening-silver').value = "0.000";
                if (el('customer-balance-info')) el('customer-balance-info').style.display = "none";
            } else if (val) {
                if (newCustContainer) newCustContainer.style.display = "block";
                setType(true);
                const selected = masterCustomers.find(c => c.id == val);
                if (selected) {
                    if (nameInput) nameInput.value = selected.name || "";
                    if (mobileInput) mobileInput.value = selected.mobile || "";
                    if (gstinInput) gstinInput.value = selected.gstin || "";
                    if (addressInput) addressInput.value = selected.address || "";
                    if (el('cust-opening-bal')) el('cust-opening-bal').value = selected.openingBalance || 0;
                    if (el('cust-bal-type')) el('cust-bal-type').value = selected.balanceType || 1;
                    if (el('cust-opening-gold')) el('cust-opening-gold').value = selected.openingGold || 0;
                    if (el('cust-opening-silver')) el('cust-opening-silver').value = selected.openingSilver || 0;

                    // AUTO GST
                    if (gstTypeSelect && shopSettings && selected.stateCode) {
                        gstTypeSelect.value = (shopSettings.stateCode === selected.stateCode) ? "intra" : "inter";
                    }
                    
                    fetchCustomerBalance(val);
                    calculateInvoice();
                }
            } else {
                if (newCustContainer) newCustContainer.style.display = "none";
                if (el('customer-balance-info')) el('customer-balance-info').style.display = "none";
            }
        };
    }

    // Get purity value from the purity string (e.g., "22K" -> 91.6, "91.6" -> 91.6)
    function parsePurityValue(purityStr) {
        if (!purityStr) return 0;
        const str = purityStr.toString().trim().toUpperCase();
        // Known karats
        const karatMap = { '24K': 99.9, '23K': 95.8, '22K': 91.6, '21K': 87.5, '20K': 83.3, '18K': 75.0, '14K': 58.3 };
        if (karatMap[str]) return karatMap[str];
        // Try parse as number (e.g., "91.6%" or "91.6")
        const num = parseFloat(str.replace('%', ''));
        return isNaN(num) ? 0 : num;
    }

    // Add Row Logic — matching the new bill settings layout
    let rowCounter = 0;
    window.addRow = function() {
        if (!itemsTableBody) return;
        
        try {
            rowCounter++;
            const row = document.createElement('tr');
            
            let optionsHtml = masterItems.map(item => 
                `<option value="${item.name}" data-category="${item.category || 'Gold'}" data-purity="${item.purity || ''}">${item.name} (${item.purity || ''} - Stock: ${item.stockQuantity || 0})</option>`
            ).join('');

            const defaultMakingPct = BS.defaultMakingPercent || 10;

            row.innerHTML = `
                <td class="row-sno">${rowCounter}</td>
                <td>
                    <select class="ri-select">
                        <option value="I" selected>I</option>
                        <option value="R">R</option>
                    </select>
                </td>
                <td>
                    <div class="item-select-container">
                        <select class="item-name-select" style="margin-bottom: 5px;">
                            <option value="">-- Select Item --</option>
                            ${optionsHtml}
                            <option value="custom">Other (Manual Entry)</option>
                        </select>
                        <div class="custom-item-details" style="display:none; border: 1px solid var(--primary-gold-light); padding: 8px; border-radius: 8px; background: rgba(255,255,255,0.5);">
                            <input type="text" class="item-name custom-name" placeholder="Enter Product Name" style="margin-bottom: 5px;">
                            <select class="custom-category" style="font-size: 0.8rem; padding: 4px;">
                                <option value="Gold">Gold Item</option>
                                <option value="Silver">Silver Item</option>
                            </select>
                        </div>
                    </div>
                </td>
                <td class="bill-col-metal">
                    <select class="metal-select">
                        <option value="Gold" selected>Gold</option>
                        <option value="Silver">Silver</option>
                    </select>
                </td>
                <td><input type="number" class="gross-wt" step="0.001" value="0.000"></td>
                <td class="bill-col-purity"><input type="number" class="purity-val" step="0.01" value="91.60" placeholder="Purity %"></td>
                <td class="bill-col-finewt"><input type="number" class="fine-wt" step="0.001" value="0.000" readonly tabindex="-1"></td>
                <td class="bill-col-rate"><input type="number" class="rate-val" step="0.01" value="0" readonly tabindex="-1"></td>
                <td class="bill-col-metalamt" style="text-align: right;"><strong class="metal-amount">0</strong></td>
                <td class="bill-col-makingpct">
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        <input type="number" class="making-pct" step="0.01" value="${defaultMakingPct}">
                        <select class="making-type-select" style="font-size: 0.65rem; padding: 2px; height: 20px; border-radius: 4px; border: 1px solid #ddd; background: rgba(255,255,255,0.8);">
                            <option value="Percentage" ${BS.makingChargeType === 'Percentage' ? 'selected' : ''}>%</option>
                            <option value="Flat" ${BS.makingChargeType === 'Flat' ? 'selected' : ''}>₹ Flat</option>
                            <option value="PerKG" ${BS.makingChargeType === 'PerKG' ? 'selected' : ''}>/ kg</option>
                        </select>
                    </div>
                </td>
                <td class="bill-col-makingamt"><input type="number" class="making-amount" step="0.01" value="0"></td>
                <td style="text-align: right;"><strong class="item-amount" style="color: var(--primary-gold-dark); white-space: nowrap;">₹ 0</strong></td>
                <td><button type="button" class="btn-remove" title="Remove"><i class="fas fa-trash"></i></button></td>
            `;

            const select = row.querySelector('.item-name-select');
            const customContainer = row.querySelector('.custom-item-details');
            const nameInput = row.querySelector('.item-name');
            const purityInput = row.querySelector('.purity-val');
            const customCat = row.querySelector('.custom-category');
            const metalSelect = row.querySelector('.metal-select');

            select.onchange = () => {
                const val = select.value;
                if (val === "custom") {
                    customContainer.style.display = "block";
                    nameInput.value = "";
                    row.dataset.category = customCat.value;
                    metalSelect.value = customCat.value;
                } else {
                    customContainer.style.display = "none";
                    nameInput.value = val;
                    const itemInfo = masterItems.find(i => i.name === val);
                    if (itemInfo) {
                        const pVal = parsePurityValue(itemInfo.purity);
                        purityInput.value = pVal.toFixed(2);
                        const category = itemInfo.category || "Gold";
                        row.dataset.category = category;
                        metalSelect.value = category;

                        // NEW: Auto-apply Silver Labor Rate
                        if (category === "Silver" && BS.silverMakingRate) {
                            const mTypeSelect = row.querySelector('.making-type-select');
                            const mPctInput = row.querySelector('.making-pct');
                            if (mTypeSelect) mTypeSelect.value = "PerKG";
                            if (mPctInput) mPctInput.value = BS.silverMakingRate;
                        }

                        if ((itemInfo.stockQuantity || 0) <= 0) alert("⚠️ Warning: Out of Stock!");
                        calculateInvoice();
                    }
                }
            };

            customCat.onchange = () => {
                row.dataset.category = customCat.value;
                metalSelect.value = customCat.value;
                calculateInvoice();
            };

            metalSelect.onchange = () => {
                row.dataset.category = metalSelect.value;
                calculateInvoice();
            };

            const riSelect = row.querySelector('.ri-select');
            riSelect.onchange = calculateInvoice;

            const mTypeSelect = row.querySelector('.making-type-select');
            if (mTypeSelect) mTypeSelect.onchange = calculateInvoice;

            const makingPctInput = row.querySelector('.making-pct');
            const makingAmtInput = row.querySelector('.making-amount');

            // If user types directly into making amount, clear out the percentage to prevent auto-override
            if (makingAmtInput && makingPctInput) {
                makingAmtInput.addEventListener('input', () => {
                    makingPctInput.value = ''; 
                });
            }

            row.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', calculateInvoice);
            });

            row.querySelector('.btn-remove').onclick = () => {
                row.remove();
                updateRowNumbers();
                calculateInvoice();
            };

            itemsTableBody.appendChild(row);
            applyColumnVisibility();
            calculateInvoice();
            return row;
        } catch (err) {
            console.error("Error adding row:", err);
            return null;
        }
    }

    function updateRowNumbers() {
        const rows = itemsTableBody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            const numEl = row.querySelector('.row-sno');
            if (numEl) numEl.textContent = index + 1;
        });
        rowCounter = rows.length;
    }

    function calculateInvoice() {
        if (!itemsTableBody) return;
        let metalValTotal = 0;
        let makingTotal = 0;
        let purchaseOnlyTotal = 0; // Total of 'I' items
        let exchangeOnlyTotal = 0; // Total of 'R' items

        const goldRate = parseFloat(el('daily-rate')?.value) || 0;
        const silverRate = parseFloat(el('silver-rate')?.value) || 0;
        
        const rows = itemsTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const ri = row.querySelector('.ri-select')?.value || 'I';
            const gWt = parseFloat(row.querySelector('.gross-wt')?.value) || 0;
            const purity = parseFloat(row.querySelector('.purity-val')?.value) || 0;
            const makingPct = parseFloat(row.querySelector('.making-pct')?.value) || 0;
            const metalSelect = row.querySelector('.metal-select');
            const category = metalSelect ? metalSelect.value : (row.dataset.category || "Gold");
            
            // Use correct rate based on metal type
            const currentRate = (category === "Silver") ? silverRate : goldRate;
            
            // Show rate in the Rate column
            const rateInput = row.querySelector('.rate-val');
            if (rateInput) rateInput.value = currentRate.toFixed(2);
            
            // Calculate Fine Weight and Metal Amount based on Billing Mode
            let fWt = 0;
            let metalAmt = 0;

            if (purity && purity > 0) {
                // Advanced Billing (Purity based)
                fWt = gWt * (purity / 100);
                metalAmt = fWt * currentRate;
            } else {
                // Simple Billing (Gross Wt based) when Purity is not defined or 0
                fWt = gWt; // Or 0, but conceptually it uses Gross Wt
                metalAmt = gWt * currentRate;
            }

            const fineWtInput = row.querySelector('.fine-wt');
            if (fineWtInput) fineWtInput.value = fWt.toFixed(3);

            const metalAmtEl = row.querySelector('.metal-amount');
            if (metalAmtEl) metalAmtEl.textContent = Math.round(metalAmt).toLocaleString('en-IN');
            
            // Calculate Making Amount
            let makingAmt = 0;
            const makingAmtInput = row.querySelector('.making-amount');
            const makingType = row.querySelector('.making-type-select')?.value || BS.makingChargeType;
            
            if (makingPct > 0) {
                // Calculate from percentage or rate
                if (makingType === 'Flat') {
                    makingAmt = makingPct; // In flat mode, the input is the direct amount
                } else if (makingType === 'PerKG') {
                    makingAmt = (gWt / 1000) * makingPct; // Rate per KG (gWt is in grams)
                } else {
                    makingAmt = metalAmt * (makingPct / 100); // Percentage mode
                }
                if (makingAmtInput) makingAmtInput.value = Math.round(makingAmt);
            } else {
                // If percentage is 0 or empty, trust the direct amount input
                makingAmt = parseFloat(makingAmtInput?.value) || 0;
            }
            
            // Total for this row
            let totalRow = metalAmt + makingAmt;
            
            row.dataset.appliedRate = currentRate; // Store for saving
            row.dataset.metalAmount = metalAmt;
            row.dataset.makingAmount = makingAmt;

            // If Receipt (R), amount is negative (customer giving back)
            if (ri === 'R') {
                totalRow = -totalRow;
                metalValTotal += -metalAmt;
                makingTotal += -makingAmt;
                exchangeOnlyTotal += (metalAmt + makingAmt);
            } else {
                metalValTotal += metalAmt;
                makingTotal += makingAmt;
                purchaseOnlyTotal += (metalAmt + makingAmt);
            }
            
            const amtEl = row.querySelector('.item-amount');
            if (amtEl) {
                const prefix = totalRow < 0 ? "- ₹ " : "₹ ";
                amtEl.textContent = `${prefix}${Math.abs(totalRow).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                if (totalRow < 0) amtEl.style.color = "#d9534f"; // Red for receipt
                else amtEl.style.color = "var(--primary-gold-dark)";
            }
        });

        const subTotalVal = metalValTotal + makingTotal;
        const totalGstRate = parseFloat(el('gst-rate-input')?.value) || 0;
        const gstType = el('gst-type-select')?.value || 'intra';
        const docType = typeSelect ? typeSelect.value : 'Tax Invoice';
        const isEstimate = docType === 'Rough Estimate';
        
        let cgstVal = 0, sgstVal = 0, igstVal = 0;
        
        const gstContainer = el('gst-container');
        if (gstContainer) {
            gstContainer.style.display = isEstimate ? 'none' : 'block';
        }

        if (!isEstimate) {
            if (gstType === 'intra') {
                const halfRate = totalGstRate / 2;
                cgstVal = subTotalVal * (halfRate / 100);
                sgstVal = subTotalVal * (halfRate / 100);
                
                if (el('cgst-sgst-rows')) el('cgst-sgst-rows').style.display = 'block';
                if (el('igst-row')) el('igst-row').style.display = 'none';
                
                const labelCGST = el('label-cgst');
                const labelSGST = el('label-sgst');
                if (labelCGST) labelCGST.textContent = `CGST (${halfRate}%):`;
                if (labelSGST) labelSGST.textContent = `SGST (${halfRate}%):`;
            } else {
                igstVal = subTotalVal * (totalGstRate / 100);
                
                if (el('cgst-sgst-rows')) el('cgst-sgst-rows').style.display = 'none';
                if (el('igst-row')) el('igst-row').style.display = 'block';
                
                const labelIGST = el('label-igst');
                if (labelIGST) labelIGST.textContent = `IGST (${totalGstRate}%):`;
            }
        }

        const discountVal = parseFloat(el('discount-input')?.value) || 0;
        const totalWithGst = (subTotalVal + cgstVal + sgstVal + igstVal) - discountVal;
        const roundedTotal = totalWithGst;
        const roundOffVal = 0;

        const setTxt = (id, val) => {
            const target = el(id);
            if (target) target.textContent = `₹ ${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        };

        setTxt('break-gold-value', metalValTotal);
        setTxt('break-making-charges', makingTotal);
        setTxt('break-sub-total', subTotalVal);
        setTxt('break-purchase-total', purchaseOnlyTotal);
        setTxt('break-exchange-total', exchangeOnlyTotal);
        setTxt('break-cgst', cgstVal);
        setTxt('break-sgst', sgstVal);
        setTxt('break-igst', igstVal);
        setTxt('break-total-amount', roundedTotal);
        setTxt('summary-subtotal', subTotalVal);
        setTxt('summary-gst', cgstVal + sgstVal + igstVal);
        setTxt('summary-total', roundedTotal);
        
        const rEl = el('break-rounded');
        if (rEl) rEl.textContent = `₹ ${roundOffVal.toFixed(2)}`;
        
        // --- PREVIEW PRINT OPTIONS ---
        const printOpt = el('print-option')?.value || "None";
        const weightSection = el('weight-summary-section');
        const balanceRow = el('preview-balance-row');
        
        if (weightSection) weightSection.style.display = (printOpt === "Weight" || printOpt === "Both") ? "grid" : "none";
        if (balanceRow) balanceRow.style.display = (printOpt === "Balance" || printOpt === "Both") ? "flex" : "none";

        // Calculate Metal Totals by Category
        let totalGoldFineInInvoice = 0;
        let totalSilverFineInInvoice = 0;
        
        let goldPurchased = 0;
        let goldReceived = 0;
        let silverPurchased = 0;
        let silverReceived = 0;
        
        itemsTableBody.querySelectorAll('tr').forEach(row => {
            const ri = row.querySelector('.ri-select')?.value || 'I';
            const metal = row.querySelector('.metal-select')?.value || row.dataset.category || "Gold";
            const fWt = parseFloat(row.querySelector('.fine-wt')?.value) || 0;
            
            const rowTotalStr = row.querySelector('.item-amount')?.innerText || "0";
            const rowTotal = parseFloat(rowTotalStr.replace(/[^0-9.-]+/g, "")) || 0;

            // If the item has a cash value (sold for cash or exchanged for cash credit), 
            // it does not affect the metal ledger (Account Statement).
            if (Math.abs(rowTotal) > 0.01) return;

            if (metal === "Gold") {
                if (ri === 'I') {
                    totalGoldFineInInvoice += fWt;
                    goldPurchased += fWt;
                } else {
                    totalGoldFineInInvoice -= fWt;
                    goldReceived += fWt;
                }
            } else if (metal === "Silver") {
                if (ri === 'I') {
                    totalSilverFineInInvoice += fWt;
                    silverPurchased += fWt;
                } else {
                    totalSilverFineInInvoice -= fWt;
                    silverReceived += fWt;
                }
            }
        });


        // Update Weight Summary UI
        if (el('sum-gold-purchased')) el('sum-gold-purchased').textContent = `${goldPurchased.toFixed(3)} g`;
        if (el('sum-gold-received')) el('sum-gold-received').textContent = `${goldReceived.toFixed(3)} g`;
        if (el('sum-silver-purchased')) el('sum-silver-purchased').textContent = `${silverPurchased.toFixed(3)} g`;
        if (el('sum-silver-received')) el('sum-silver-received').textContent = `${silverReceived.toFixed(3)} g`;

        // Calculate Net Balances
        const custId = el('cust-name-select')?.value;
        if (custId === 'custom') {
            customerInitialBalance = {
                gold: parseFloat(el('cust-opening-gold')?.value) || 0,
                silver: parseFloat(el('cust-opening-silver')?.value) || 0,
                amount: parseFloat(el('cust-opening-bal')?.value) || 0,
                amountType: el('cust-bal-type')?.value == "2" ? "Cr" : "Dr"
            };
        } else if (!custId) {
            customerInitialBalance = { gold: 0, silver: 0, amount: 0, amountType: 'Dr' };
        }

        const netGold = customerInitialBalance.gold + totalGoldFineInInvoice;
        const netSilver = customerInitialBalance.silver + totalSilverFineInInvoice;
        
        // Apply Bhav Cut to Net Balances
        let goldWithBhavCut = netGold;
        let silverWithBhavCut = netSilver;

        const isBhavCutEnabled = el('enable-bhav-cut')?.value === "true";
        if (isBhavCutEnabled) {
            const cutWeight = parseFloat(el('bhav-cut-weight')?.value) || 0;
            const cutMetal = el('bhav-cut-metal-type')?.value || "Gold";
            if (cutMetal === "Gold") goldWithBhavCut -= cutWeight;
            else silverWithBhavCut -= cutWeight;
        }

        // Update Bhav Cut Summary Row in Breakdown
        const summaryRow = el('bhav-cut-summary-row');
        if (summaryRow) {
            if (isBhavCutEnabled) {
                summaryRow.style.display = 'flex';
                const cutWeight = el('bhav-cut-weight')?.value || "0.000";
                const cutMetal = el('bhav-cut-metal-type')?.value || "Gold";
                const cutRate = el('bhav-cut-rate')?.value || "0.00";
                
                if (el('bhav-cut-display-weight')) el('bhav-cut-display-weight').textContent = `- ${cutWeight} g`;
                if (el('bhav-cut-display-details')) el('bhav-cut-display-details').textContent = `${cutMetal}: ${cutWeight} g (Rate: ₹ ${cutRate})`;
            } else {
                summaryRow.style.display = 'none';
            }
        }

        // Calculate Net Totals for Closing
        const initialAmtVal = customerInitialBalance.amountType === 'Dr' ? customerInitialBalance.amount : -customerInitialBalance.amount;
        const outstanding = roundedTotal - (parseFloat(el('paid-amount')?.value) || 0);
        const netAmtTotal = initialAmtVal + outstanding;
        const netAmtAbs = Math.abs(netAmtTotal);
        const netAmtType = netAmtTotal >= 0 ? "Dr" : "Cr";

        // Update Opening Balance Boxes (In Customer Section)
        if (el('bal-gold')) el('bal-gold').textContent = `${customerInitialBalance.gold.toFixed(3)} g`;
        if (el('bal-silver')) el('bal-silver').textContent = `${customerInitialBalance.silver.toFixed(3)} g`;

        const initAmtAbs = Math.abs(initialAmtVal);
        const initAmtType = customerInitialBalance.amountType;
        if (el('bal-amount')) {
            el('bal-amount').textContent = `₹ ${initAmtAbs.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${initAmtType})`;
            el('bal-amount').style.color = initAmtType === "Dr" ? "#4CAF50" : "#d9534f";
        }

        // Preview Weight & Balance (Legacy fields)
        if (el('preview-net-balance')) el('preview-net-balance').textContent = `₹ ${netAmtAbs.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (${netAmtType})`;

        // Update Final Net Position Summary (Bottom)
        if (el('final-net-gold')) {
            const val = goldWithBhavCut;
            el('final-net-gold').textContent = `${Math.abs(val).toFixed(3)} g (${val >= 0 ? "Dr" : "Cr"})`;
        }
        if (el('final-net-silver')) {
            const val = silverWithBhavCut;
            el('final-net-silver').textContent = `${Math.abs(val).toFixed(3)} g (${val >= 0 ? "Dr" : "Cr"})`;
        }

        updateOutstanding();
    }

    function updateOutstanding() {
        const totalText = el('break-total-amount')?.innerText || "0";
        const total = parseFloat(totalText.replace(/[^0-9.-]+/g, "")) || 0;
        const paid = parseFloat(el('paid-amount')?.value) || 0;
        const balance = total - paid;
        const bEl = el('outstanding-balance');
        if (bEl) bEl.textContent = `₹ ${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }

    const getInvoiceData = () => {
        const getTxtVal = (id) => parseFloat(el(id)?.innerText.replace(/[^0-9.-]+/g, "")) || 0;
        const custIdVal = el('cust-name-select')?.value;
        const isNewCust = custIdVal === 'custom' || !custIdVal;
        
        const invoiceData = {
            InvoiceType: el('invoice-type')?.value || "Tax Invoice",
            InvoiceNo: el('invoice-no')?.value || "",
            Date: el('invoice-date')?.value || "",
            PaymentMode: document.querySelector('input[name="payment-mode"]:checked')?.value || "Cash",
            PaidAmount: parseFloat(el('paid-amount')?.value) || 0,
            GstRate: parseFloat(el('gst-rate-input')?.value) || 0,
            Discount: parseFloat(el('discount-input')?.value) || 0,
            Remarks: el('remarks')?.value || "",
            PrintOption: el('print-option')?.value || "None",
            CustomerId: isNewCust ? 0 : parseInt(custIdVal),
            Customer: isNewCust ? {
                Name: el('cust-name')?.value || "",
                Mobile: el('cust-mobile')?.value || "",
                GSTIN: el('cust-gstin')?.value || "",
                Address: el('cust-address')?.value || "",
                OpeningBalance: parseFloat(el('cust-opening-bal')?.value) || 0,
                OpeningGold: parseFloat(el('cust-opening-gold')?.value) || 0,
                OpeningSilver: parseFloat(el('cust-opening-silver')?.value) || 0,
                BalanceType: parseInt(el('cust-bal-type')?.value) || 1
            } : null,
            Items: [],
            GoldValueTotal: getTxtVal('break-gold-value'),
            MakingChargesTotal: getTxtVal('break-making-charges'),
            SubTotal: getTxtVal('break-sub-total'),
            CGST: getTxtVal('break-cgst'),
            SGST: getTxtVal('break-sgst'),
            IGST: getTxtVal('break-igst'),
            TotalAmount: getTxtVal('break-total-amount'),
            RoundedOff: parseFloat(el('break-rounded')?.innerText.replace(/[^0-9.-]+/g, "")) || 0,
            
            // New: Metal Receipt Fields
            MetalReceivedType: null,
            MetalReceivedWeight: 0,
            MetalReceivedPurity: 0,
            MetalReceivedFineWeight: 0,

            // Bhav Cut Fields
            BhavCutMetalType: el('enable-bhav-cut')?.value === "true" ? el('bhav-cut-metal-type')?.value : null,
            BhavCutCash: el('enable-bhav-cut')?.value === "true" ? (parseFloat(el('bhav-cut-cash')?.value) || 0) : 0,
            BhavCutRate: el('enable-bhav-cut')?.value === "true" ? (parseFloat(el('bhav-cut-rate')?.value) || 0) : 0,
            BhavCutWeight: el('enable-bhav-cut')?.value === "true" ? (parseFloat(el('bhav-cut-weight')?.value) || 0) : 0
        };

        const rows = itemsTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const rowAmt = parseFloat(row.querySelector('.item-amount')?.innerText.replace(/[^0-9.-]+/g, "")) || 0;
            const gWt = parseFloat(row.querySelector('.gross-wt')?.value) || 0;
            const metalSelect = row.querySelector('.metal-select');
            invoiceData.Items.push({
                ItemName: row.querySelector('.item-name')?.value || row.querySelector('.item-name-select')?.value || "",
                RI: row.querySelector('.ri-select')?.value || "I",
                Metal: metalSelect ? metalSelect.value : (row.dataset.category || "Gold"),
                Purity: row.querySelector('.purity-val')?.value || "",
                GrossWt: gWt,
                NetWt: gWt, 
                FineWt: parseFloat(row.querySelector('.fine-wt')?.value) || 0,
                Rate: parseFloat(row.dataset.appliedRate) || 0,
                MetalAmount: parseFloat(row.dataset.metalAmount) || 0,
                MakingPercent: parseFloat(row.querySelector('.making-pct')?.value) || 0,
                MakingCharges: parseFloat(row.dataset.makingAmount) || 0,
                Amount: rowAmt
            });
        });
        return invoiceData;
    };

    const previewBtn = el('preview-invoice-btn');
    if (previewBtn) {
        previewBtn.onclick = async () => {
            try {
                const invoiceData = getInvoiceData();
                const response = await fetch('/Invoices/Preview', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invoiceData)
                });

                if (response.ok) {
                    const html = await response.text();
                    const win = window.open('', '_blank');
                    win.document.write(html);
                    win.document.close();
                } else {
                    alert("Preview failed. Please ensure all items are filled.");
                }
            } catch (err) {
                console.error(err);
                alert("Preview error: " + err.message);
            }
        };
    }

    if (saveBtn) {
        saveBtn.onclick = async () => {
            try {
                const custIdVal = el('cust-name-select')?.value;
                const isNewCust = custIdVal === 'custom' || !custIdVal;
                
                // --- CUSTOMER VALIDATION ---
                if (isNewCust) {
                    const name = el('cust-name')?.value.trim();
                    const mobile = el('cust-mobile')?.value.trim();
                    const address = el('cust-address')?.value.trim();

                    if (!name) { alert("⚠️ Required: Please enter the Customer Full Name."); el('cust-name').focus(); return; }
                    if (!mobile) { alert("⚠️ Required: Please enter the Mobile Number."); el('cust-mobile').focus(); return; }
                    if (!address) { alert("⚠️ Required: Please enter the Billing Address."); el('cust-address').focus(); return; }
                } else if (!custIdVal) {
                    alert("⚠️ Please select a customer or fill new details.");
                    el('cust-name-select').focus();
                    return;
                }
                
                const invoiceData = getInvoiceData();

                const response = await fetch('/Invoices/Create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invoiceData)
                });

                if (response.ok) {
                    window.location.href = '/Invoices';
                } else {
                    const errorMsg = await response.text();
                    alert("Error saving invoice: " + errorMsg);
                }
            } catch (err) { 
                console.error(err); 
                alert("Save failed: " + err.message); 
            }
        };
    }

    // --- Metal Conversion Tool (Popup) Logic ---
    const calcModal = el('calculator-modal');
    const openCalcBtns = document.querySelectorAll('.open-calculator-btn');
    const closeCalcBtn = document.querySelector('.close-modal');
    
    const calcCashInput = el('calc-cash');
    const calcRateInput = el('calc-rate');
    const calcMetalSelect = el('calc-metal-type');
    const calcPurityInput = el('calc-purity');
    const calcResultVal = el('calc-result-val');
    const applyBtn = el('apply-calc-to-invoice');

    openCalcBtns.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            // Sync values from main section if they exist
            if (calcCashInput) calcCashInput.value = el('bhav-cut-cash')?.value || "0.00";
            if (calcRateInput) calcRateInput.value = el('bhav-cut-rate')?.value || "0.00";
            if (calcMetalSelect) calcMetalSelect.value = el('bhav-cut-metal-type')?.value || "Gold";
            
            updateCalcToolResult();
            calcModal.classList.add('show');
            
            // Auto-focus the first field for speed
            setTimeout(() => calcCashInput?.focus(), 300);
        };
    });

    if (closeCalcBtn) {
        closeCalcBtn.onclick = () => calcModal.classList.remove('show');
    }

    // Modal no longer closes on outside click or on Apply
    function updateCalcToolResult() {
        const cash = parseFloat(calcCashInput?.value) || 0;
        const rate = parseFloat(calcRateInput?.value) || 0;
        const purity = parseFloat(calcPurityInput?.value) || 100;

        if (rate > 0) {
            const weight = (cash / rate) * (purity / 100);
            calcResultVal.textContent = weight.toFixed(3);
        } else {
            calcResultVal.textContent = "0.000";
        }
    }

    function handleApplyCalc() {
        const cash = parseFloat(calcCashInput?.value) || 0;
        const rate = parseFloat(calcRateInput?.value) || 0;
        const purity = parseFloat(calcPurityInput?.value) || 100;
        const metal = calcMetalSelect?.value || "Gold";
        const weight = calcResultVal.textContent;

        if (cash <= 0 || rate <= 0) {
            alert("Please enter a valid cash amount and conversion rate.");
            return;
        }

        // Auto-post as a new item line
        if (typeof window.addRow === 'function') {
            const row = window.addRow();
            if (row) {
                const riSelect = row.querySelector('.ri-select');
                const nameSelect = row.querySelector('.item-name-select');
                const nameInput = row.querySelector('.item-name');
                const metalSelect = row.querySelector('.metal-select');
                const grossWtInput = row.querySelector('.gross-wt');
                const purityInput = row.querySelector('.purity-val');
                const rateInput = row.querySelector('.rate-val');
                const makingPctInput = row.querySelector('.making-pct');

                if (riSelect) riSelect.value = "R";
                if (nameSelect) {
                    nameSelect.value = "custom";
                    nameSelect.dispatchEvent(new Event('change'));
                }
                
                if (nameInput) nameInput.value = `Bhav Cut: ₹${cash.toLocaleString('en-IN')}`;
                if (metalSelect) metalSelect.value = metal;
                
                // Gross weight is calculated so that Fine weight * rate = cash
                const calculatedGrossWt = (cash / rate) / (purity / 100);
                if (grossWtInput) grossWtInput.value = calculatedGrossWt.toFixed(3);
                if (purityInput) purityInput.value = purity.toFixed(2);
                if (rateInput) rateInput.value = rate.toFixed(2);
                if (makingPctInput) {
                    makingPctInput.value = 0;
                    // Trigger input event to clear making charges logic if any
                    makingPctInput.dispatchEvent(new Event('input'));
                }
                
                // Final recalculation for the entire invoice
                if (typeof calculateInvoice === 'function') calculateInvoice();
            }
        }

        // Close modal
        calcModal.classList.remove('show');
    }

    // Remove Bhav Cut Logic
    if (el('remove-bhav-cut')) {
        el('remove-bhav-cut').onclick = () => {
            if (el('enable-bhav-cut')) el('enable-bhav-cut').value = "false";
            if (el('bhav-cut-weight')) el('bhav-cut-weight').value = "0";
            calculateInvoice();
        };
    }

    [calcCashInput, calcRateInput, calcPurityInput].forEach(inp => {
        if (inp) {
            inp.oninput = updateCalcToolResult;
            // Add Enter key listener for auto-close/apply
            inp.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyCalc();
                }
            };
        }
    });

    if (applyBtn) {
        applyBtn.onclick = handleApplyCalc;
    }

    // Run initialization
    (async () => {
        if (dateInput) dateInput.valueAsDate = new Date();
        await loadMasterData();
        await fetchNextNumber();
        applyColumnVisibility();
        if (itemsTableBody && itemsTableBody.children.length === 0) window.addRow();
    })();
});
