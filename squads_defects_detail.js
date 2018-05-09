var ds = datasources["RTCDATA"];
var htmlContent = "";

function getValue(_ds, env, range, priority) {
    if(typeof(_ds[env])!="undefined"
      && typeof(_ds[env][range])!="undefined"
      && typeof(_ds[env][range][priority])!="undefined") {
    	return _ds[env][range][priority];
	} else {
        return 0;
    }
}
htmlContent += "<style type='text/css'>";
htmlContent += ".clr{clear:both;}";
htmlContent += ".col{float:left;width:130px;} ";
htmlContent += "</style>";
htmlContent += "<DIV class='clr'>"+ds["summary"]+"</DIV>";
htmlContent += "<div class='clr'>Overall</div>";
htmlContent += "<div class='clr'>";
htmlContent += "<div class='col'>"+"Production"+"</div>";
htmlContent += "<div class='col'>"+"Total"+"</div>";
htmlContent += "<div class='col'>"+getValue(ds['overall'], "Production", "Total", "Blocker")+"</div>";
htmlContent += "<div class='col'>"+getValue(ds['overall'], "Production", "Total", "Critical")+"</div>";
htmlContent += "<div class='col'>"+getValue(ds['overall'], "Production", "Total", "Normal")+"</div>";
htmlContent += "</div>";
htmlContent += "<div class='clr'>";
htmlContent += "<div class='col'>&nbsp;</div>";
htmlContent += "<div class='col'>"+"Unresolved"+"</div>";
htmlContent += "<div class='col'>"+getValue(ds['overall'], "Production", "Unresolved", "Blocker")+"</div>";
htmlContent += "<div class='col'>"+getValue(ds['overall'], "Production", "Unresolved", "Critical")+"</div>";
htmlContent += "<div class='col'>"+getValue(ds['overall'], "Production", "Unresolved", "Normal")+"</div>";
htmlContent += "</div>";
htmlContent += "<div class='clr'>";
htmlContent += "<div class='col'>"+"Others"+"</div>";
htmlContent += "<div class='col'>"+"Total"+"</div>";
htmlContent += "<div class='col'>"+getValue(ds['overall'], "Others", "Total", "Blocker")+"</div>";
htmlContent += "<div class='col'>"+getValue(ds['overall'], "Others", "Total", "Critical")+"</div>";
htmlContent += "<div class='col'>"+getValue(ds['overall'], "Others", "Total", "Normal")+"</div>";
htmlContent += "</div>";
htmlContent += "<div class='clr'>";
htmlContent += "<div class='col'>&nbsp;</div>";
htmlContent += "<div class='col'>"+"Unresolved"+"</div>";
htmlContent += "<div class='col'>"+getValue(ds['overall'], "Others", "Unresolved", "Blocker")+"</div>";
htmlContent += "<div class='col'>"+getValue(ds['overall'], "Others", "Unresolved", "Critical")+"</div>";
htmlContent += "<div class='col'>"+getValue(ds['overall'], "Others", "Unresolved", "Normal")+"</div>";
htmlContent += "</div>";
var dsSquad = ds["squads"];
htmlContent += "<div class='clr'>Defects on Prod by squads</div>";
htmlContent += "<div class='clr'>";
htmlContent += "<div class='col'>Sqaud Name</div>";
htmlContent += "<div class='col'>Found In</div>";
htmlContent += "<div class='col'>Range</div>";
htmlContent += "<div class='col'>Blocker</div>";
htmlContent += "<div class='col'>Critical</div>";
htmlContent += "<div class='col'>Other</div>";
htmlContent += "</div>";

for (var squadName in dsSquad) {
    htmlContent += "<div class='clr'>";
    htmlContent += "<div class='col'>"+squadName+"</div>";
    htmlContent += "<div class='col'>"+"Production"+"</div>";
    htmlContent += "<div class='col'>"+"Total"+"</div>";
    htmlContent += "<div class='col'>"+getValue(dsSquad[squadName], "Production", "Total", "Blocker")+"</div>";
    htmlContent += "<div class='col'>"+getValue(dsSquad[squadName], "Production", "Total", "Critical")+"</div>";
    htmlContent += "<div class='col'>"+getValue(dsSquad[squadName], "Production", "Total", "Normal")+"</div>";
    htmlContent += "</div>";
}
htmlContent += "<div class='clr'>";
htmlContent += "<div class='col'>Found In</div><div class='col'>Range</div><div class='col'>Blocker</div><div class='col'>Critical</div><div class='col'>Other</div>";
htmlContent += "</div>";
return htmlContent;