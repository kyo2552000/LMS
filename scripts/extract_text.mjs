import mammoth from "mammoth";
import fs from "fs";

mammoth.extractRawText({path: "Báo cáo 2.2_1.docx"})
    .then(function(result){
        var text = result.value; 
        fs.writeFileSync("report_full_content.txt", text);
        console.log("Extracted " + text.length + " characters to report_full_content.txt");
    })
    .catch(err => console.error(err));
