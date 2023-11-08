import { PageItem, SettingData, indexItem } from "./type";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export function setPageList(figma: PluginAPI, settingData: SettingData, setSettingData: Function) {
    const pageList = figma.root.children;
    const pageData: PageItem[] = [];

    if (settingData.pageList.length === 0) {
        pageList.forEach((page: PageNode) => {
            pageData.push({
                id: page.id,
                name: page.name,
                checked: false,
            });
        });
    } else {
        const preData = settingData;

        preData.pageList.forEach((item) => {
            pageList.forEach((page) => {
                if (item.id === page.id) {
                    pageData.push(item);
                }
            });
        });

        pageList.forEach((page) => {
            const hasList = preData.pageList.filter((item) => item.id === page.id);

            if (hasList.length === 0) {
                pageData.push({
                    id: page.id,
                    name: page.name,
                    checked: false,
                });
            }
        });
    }

    setSettingData(
        Object.assign(settingData, {
            pageList: pageData,
        })
    );
}

export function refresh(rowData: SettingData, indexData: indexItem[], setPageName: Function, setSectionName: Function, setUpdateData: Function, setWidgetStatus: Function, setIndexData: Function) {
    const data = rowData;
    const list: any[] = [];
    console.log('refresh')
    const pageSelected = data.pageList.filter((page) => page.checked === true);
    let pageList: any = [];
    let childList: any[] = [];
    let typeName: string = "";
    let regexp: RegExp = new RegExp(".*");

    if (pageSelected.length > 0) {
        pageList = [];

        pageSelected.forEach((data: PageItem) => {
            pageList.push(figma.getNodeById(data.id));
        });
    } else {
        pageList = figma.root.children;
    }

    setPageName(data.pageName);
    setSectionName(data.sectionName);

    // 정규식 설정
    if (data.rule === "start") {
        regexp = new RegExp(`^${data.reg}`);
    }

    if (data.rule === "end") {
        regexp = new RegExp(`${data.reg}$`);
    }

    if (data.rule === "reg") {
        regexp = new RegExp(`${data.reg}`);
    }

    pageList.forEach((page: PageNode) => {
        childList = childList.concat(page.children);
        console.log(childList);
    });

    if (data.target === "frameinsection") {
        typeName = "SECTION";
    } else {
        typeName = data.target.toUpperCase();
    }

    childList = childList.filter((item) => item.type === typeName);
    console.log(childList)
    if (data.target === "frameinsection") {
        childList.forEach((section) => {
            const targetChild = section.children.filter((row: any) => row.type === "FRAME");
  

            targetChild.forEach((target: any) => {
                list.push({
                    id: target.id,
                    sectionName: section.name,
                    name: target.name,
                    type: target.type,
                    parent: target.parent,
                });
            });
        });
    } else {
        childList.forEach((target: FrameNode) => {
            let tn = target.findOne(n => n.type === "TEXT");
            if(tn){
                tn = tn as TextNode
                console.log(tn.hyperlink)
                list.push({
                    id: target.id,
                    sectionName: "",
                    name: target.name,
                    type: target.type,
                    link: tn.hyperlink,
                    parent: target.parent,
                });
            }else{
                list.push({
                    id: target.id,
                    sectionName: "",
                    name: target.name,
                    type: target.type,
                    parent: target.parent,
                });
            }

            
        });
    }

    const accordList = list.filter((item) => {
        if (data.rule === "none") {
            return item;
        } else {
            if (regexp.test(item.name) === true) {
                return item;
            }
        }
    });

    listDataArrange(accordList, indexData, setWidgetStatus, setIndexData);
    setUpdateData(getToday());
}

export function listDataArrange(list: any[], indexData: indexItem[], setWidgetStatus: Function, setIndexData: Function) {
    if (list.length !== 0) {
        let data: indexItem[] = [];

        console.log(indexData)

        if (indexData.length === 0) {
            // just add
            list.forEach((item) => {
                let pageName;

                if (item.parent !== null) {
                    if (item.parent.type === "PAGE") {
                        pageName = item.parent.name;
                    } else {
                        if (item.parent.parent !== null) {
                            if (item.parent.parent.type === "PAGE") {
                                pageName = item.parent.parent.name;
                            } else {
                                pageName = "";
                            }
                        }
                    }
                }

                data.push({
                    id: item.id,
                    name: item.name,
                    sectionName: item.sectionName,
                    pageName: pageName,
                    link: indexData[0].link,
                    status: 0,
                    other: "",
                    otherEdit: true,
                });
            });
        } else {
            // arrange
            indexData.forEach((row, count) => {
                const haveItem = list.filter((item) => item.id === row.id);

                if (haveItem.length === 0) {
                    indexData.splice(count, 1);
                }
            });

            list.forEach((row) => {
                let hasItem = false;
                let count = 0;
                let data: indexItem = {
                    id: "",
                    name: "",
                    sectionName: "",
                    link: '',
                    pageName: "",
                    status: 0,
                    other: "",
                    otherEdit: true,
                };
                let pageName;

                indexData.forEach((item, i) => {
                    if (row.id === item.id) {
                        hasItem = true;
                        count = i;
                        data = item;
                    }
                });

                if (row.parent !== null) {
                    if (row.parent.type === "PAGE") {
                        pageName = row.parent.name;
                    } else {
                        if (row.parent.parent !== null) {
                            if (row.parent.parent.type === "PAGE") {
                                pageName = row.parent.parent.name;
                            } else {
                                pageName = "";
                            }
                        }
                    }
                }

                // @ts-ignore : IDE가 인식못함
              console.log(row.name)

              console.log(row.link?.value)
                if (hasItem) {
                    indexData[count] = {
                        id: data.id,
                        name: row.name,
                        sectionName: data.sectionName,
                        link: row.link?.value,
                        pageName: pageName,
                        status: data.status,
                        other: data.other,
                        otherEdit: data.otherEdit,
                    };
                } else {
                    indexData.push({
                        id: row.id,
                        name: row.name,
                        sectionName: row.sectionName,
                        link: data?.link,
                        pageName: pageName,
                        status: 0,
                        other: "",
                        otherEdit: true,
                    });
                }
            });

            data = indexData;
        }

        setIndexData(data);
        setWidgetStatus("have");
    } else {
        setWidgetStatus("null");
    }
}

function getToday() {
    return  dayjs().utc().format("YYYY.MM.DD HH:mm (UTC)");
}
