export class PathLogic {
    GetPathLinesFromPolygon(polygon: Array<Point>, angle, step): Array<Line> {
        let lines: Array<Line> = [];
        let result: Array<Line> = [];

        let translatedPolygon: Array<Point> = [];

        if(polygon.length < 3) return null;

        for (let point of polygon)
        {
            let translatedPoint = this.GetTranslatedPoint(angle, point);
            translatedPolygon.push(translatedPoint);
        }

        var nearestPoint = translatedPolygon[0];
        var farestPoint = translatedPolygon[0];
        var maxX = nearestPoint.X;
        var minX = nearestPoint.X;

        for (let i = 0; i < translatedPolygon.length; i++)
        {
            if (translatedPolygon[i].X > maxX)
            {
                farestPoint = translatedPolygon[i];
                maxX = translatedPolygon[i].X;
            }
            if (translatedPolygon[i].X < minX)
            {
                nearestPoint = translatedPolygon[i];
                minX = translatedPolygon[i].X;
            }
        }

        let topLine: Line;
        let bottomLine: Line;

        for (let i = nearestPoint.X + step; i < farestPoint.X; i += step)
        {
            var intersectingLines = this.getIntersectingLines(translatedPolygon, i);
            if (intersectingLines.length % 2 != 0)
            {
                //MessageBox.Show("Something went wrong. Bad shape!");
            }
            let ys: Array<number> = [];
            for (let k = 1; k < intersectingLines.length; k += 2)
            {

                topLine = intersectingLines[k - 1];
                bottomLine = intersectingLines[k];

                //get next vertical line
                var nY1L = Math.abs(topLine.EndPoint.Y) > Math.abs(topLine.StartPoint.Y) ? topLine.StartPoint.Y : topLine.EndPoint.Y;//Math.Abs(topLine.P1.Y - topLine.P2.Y);                    
                var nY1G = Math.abs(topLine.EndPoint.Y) > Math.abs(topLine.StartPoint.Y) ? topLine.EndPoint.Y : topLine.StartPoint.Y;
                nY1G -= nY1L;

                var pY1L = Math.abs(bottomLine.EndPoint.Y) > Math.abs(bottomLine.StartPoint.Y) ? bottomLine.StartPoint.Y : bottomLine.EndPoint.Y;
                var pY1G = Math.abs(bottomLine.EndPoint.Y) > Math.abs(bottomLine.StartPoint.Y) ? bottomLine.EndPoint.Y : bottomLine.StartPoint.Y;
                pY1G -= pY1L;

                var nC = Math.abs(topLine.EndPoint.Y) > Math.abs(topLine.StartPoint.Y) ? Math.abs(i - topLine.StartPoint.X) : Math.abs(i - topLine.EndPoint.X);
                var pC = Math.abs(bottomLine.EndPoint.Y) > Math.abs(bottomLine.StartPoint.Y) ? Math.abs(i - bottomLine.StartPoint.X) : Math.abs(i - bottomLine.EndPoint.X);
                var y1 = ((nY1G * nC) / (topLine.EndPoint.X - topLine.StartPoint.X)) + nY1L;
                var y2 = ((pY1G * pC) / (bottomLine.EndPoint.X - bottomLine.StartPoint.X)) + pY1L;//prevNearestPoint.X;
                ys.push(y1);
                ys.push(y2);
            }
            ys.sort();
            for (let l = 1; l < ys.length; l += 2)
            {
                
                let point1: Point = {X: i, Y: ys[l - 1]};
                let point2: Point = {X: i, Y: ys[l]};

                let line: Line = {StartPoint: point1, EndPoint: point2};

                lines.push(line);
            }

            
        }
        for (let line of lines)
        {
            result.push(this.GetTranslatedLine(-angle, line));
        }
        return result;
    } 

    GetTranslatedPoint(angle, point: Point): Point {

        let newPoint: Point = {X: 0, Y: 0};
        var tAngle = angle * (Math.PI / 180);
        newPoint.X = (point.X * Math.cos(tAngle) - point.Y * Math.sin(tAngle));
        newPoint.Y = (point.X * Math.sin(tAngle) + point.Y * Math.cos(tAngle));

        return newPoint;
    }

    GetTranslatedLine(angle, l: Line): Line {
        let tAngle = angle * (Math.PI / 180);
        let p1: Point = {X: 0, Y: 0};
        p1.X = l.StartPoint.X * Math.cos(tAngle) - l.StartPoint.Y * Math.sin(tAngle);
        p1.Y = l.StartPoint.X * Math.sin(tAngle) + l.StartPoint.Y * Math.cos(tAngle);
        let p2: Point = {X: 0, Y: 0};
        p2.X = l.EndPoint.X * Math.cos(tAngle) - l.EndPoint.Y * Math.sin(tAngle);
        p2.Y = l.EndPoint.X * Math.sin(tAngle) + l.EndPoint.Y * Math.cos(tAngle);

        let result: Line = {StartPoint: p1, EndPoint: p2};
        return result;
    }

    getIntersectingLines(polygon: Array<Point>, x: number): Array<Line> {
            let lines: Array<Line> = [];
            let prevPoint = polygon[0];
            for (let i = 1; i < polygon.length; i++)
            {
                if (prevPoint.X <= x && polygon[i].X >= x ||
                    (prevPoint.X >= x && polygon[i].X <= x))
                {
                    if (!this.isPointAlreadyAdded(lines, polygon[i].X, x) && !this.isPointAlreadyAdded(lines, prevPoint.X, x))
                    {
                        if (prevPoint.X < polygon[i].X) {
                            let ll: Line = {StartPoint: prevPoint, EndPoint: polygon[i]};
                            lines.push(ll);
                        }
                        else {
                            let ll: Line = {StartPoint: polygon[i], EndPoint: prevPoint};
                            lines.push(ll);
                        }
                    }
                }
                prevPoint = polygon[i];
            }
            if ((prevPoint.X <= x && polygon[0].X >= x) ||
                    (prevPoint.X >= x && polygon[0].X <= x))
            {
                if (!this.isPointAlreadyAdded(lines, polygon[0].X, x) && !this.isPointAlreadyAdded(lines, prevPoint.X, x))
                {
                    if (prevPoint.X < polygon[0].X) {
                        let ll: Line = {StartPoint: prevPoint, EndPoint: polygon[0]};
                        lines.push(ll);
                    }
                    else {
                        let ll: Line = {StartPoint: polygon[0], EndPoint: prevPoint};
                        lines.push(ll);
                    }
                }
            }
            let l1: Line;
            let l2: Line;
            let toRemove: Array<Line> = [];
            let next = 0;
            for (let line of lines)
            {
                if (line.StartPoint.X == x || line.EndPoint.X == x)
                {
                    if (next == 0)
                    {
                        l1 = line;
                        next = 1;
                    }
                    else
                    {
                        l2 = line;
                        next = 0;
                        if (this.isEqualPoint(l1.StartPoint, l2.EndPoint))
                        {
                            if ((l1.EndPoint.X < x && l2.StartPoint.X > x) || (l1.EndPoint.X > x && l2.StartPoint.X < x))
                                toRemove.push(l2);
                        }
                        else
                        {
                            if ((l1.StartPoint.X < x && l2.EndPoint.X > x) || (l1.StartPoint.X > x && l2.EndPoint.X < x))
                                toRemove.push(l2);
                        }
                    }
                }
            }
            for (let line of lines)
            {
                if (line.StartPoint.X == line.EndPoint.X)
                    toRemove.push(line);
            }
            for (let line of lines)
            {
                if (line.StartPoint.X == x || line.EndPoint.X == x)
                {
                    if (next == 0)
                    {
                        l1 = line;
                        next = 1;
                    }
                    else
                    {
                        l2 = line;
                        next = 0;
                        if (this.isEqualPoint(l1.StartPoint, l2.EndPoint))
                        {
                            if ((l1.EndPoint.X < x && l2.StartPoint.X > x) || (l1.EndPoint.X > x && l2.StartPoint.X < x))
                                toRemove.push(l2);
                        }
                        else
                        {
                            if ((l1.StartPoint.X < x && l2.EndPoint.X > x) || (l1.StartPoint.X > x && l2.EndPoint.X < x))
                                toRemove.push(l2);
                        }
                    }
                }
            }
            if (toRemove.length > 0)
            {
                for (let r of toRemove)
                {
                    var ind = lines.findIndex(x => x.StartPoint === r.StartPoint && x.EndPoint === r.EndPoint);
                    if(ind > -1)
                        lines.splice(ind, 1);
                }
            }
            return lines;
        }

        isPointAlreadyAdded(lines: Array<Line>, x: number, step: number): Boolean
        {
            for (let line of lines)
            {
                if ((line.StartPoint.X == x || line.EndPoint.X == x) && (line.StartPoint.X == step || line.EndPoint.X == step))
                    return false;
            }
            return false;
        }

        isEqualPoint(p1: Point, p2: Point): Boolean
        {
            return p1.X == p2.X;
        }
}